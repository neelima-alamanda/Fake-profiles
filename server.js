require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const twilio = require("twilio");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL connection
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    };

const pool = new Pool(poolConfig);

// Twilio Verify client (initialized conditionally so AUTH_MODE=demo can start without Twilio credentials)
const authMode = process.env.AUTH_MODE || "twilio";
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Demo OTPs are stored temporarily in memory.
// They expire automatically and are removed after successful verification.
const demoOtps = new Map();

function generateDemoOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Calculate age from DOB
function getAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// ---- SEND OTP ----
app.post("/send-otp", async (req, res) => {
  const { apar_id, phone, dob, action } = req.body;

  if (!/^\d{12}$/.test(apar_id))
    return res
      .status(400)
      .json({ success: false, message: "APAAR ID must be 12 digits" });

  if (!/^\d{10}$/.test(phone))
    return res
      .status(400)
      .json({ success: false, message: "Phone number must be 10 digits" });

  if (action === "signup") {
    if (!dob || getAge(dob) < 15) {
      return res.json({
        success: false,
        message: "Age must be at least 15 years",
      });
    }
  }

  try {
    // Check if user exists
    
    let userRes;

    if (action === "signup") {
      userRes = await pool.query(
        "SELECT * FROM users WHERE apar_id=$1 OR phone=$2",
        [apar_id, phone]
      );
    } else {
      userRes = await pool.query(
        "SELECT * FROM users WHERE apar_id=$1 AND phone=$2",
        [apar_id, phone]
      );
    }

    if (action === "signup" && userRes.rows.length > 0) {
      const existing = userRes.rows[0];

      if (existing.apar_id === apar_id) {
        return res.json({
          success: false,
          message: "APAAR ID already exists. Please login.",
        });
      }

      if (existing.phone === phone) {
        return res.json({
          success: false,
          message: "Phone number already exists. Please login.",
        });
      }
    }

    if (action === "login" && userRes.rows.length === 0) {
      return res.json({
        success: false,
        message: "No account found. Please signup.",
      });
    }

    if (authMode === "demo") {
      const otp = generateDemoOtp();
      const otpKey = `${action}:${apar_id}:${phone}`;

      demoOtps.set(otpKey, {
        otpHash: hashOtp(otp),
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: `Demo OTP generated: ${otp}`,
        demoMode: true,
      });
    }

    // Twilio Verify mode
    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({
        success: false,
        message: "Twilio Verify service is not configured",
      });
    }

    await twilioClient.verify.v2.services(verifyServiceSid).verifications.create({
      to: `+91${phone}`,
      channel: "sms",
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
      demoMode: false,
    });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ---- VERIFY OTP ----
app.post("/verify-otp", async (req, res) => {
  const { apar_id, phone, otp, dob, action } = req.body;

  if (!apar_id || !phone || !otp || !action) {
  return res
    .status(400)
    .json({ success: false, message: "All fields required" });
  }

  if (!/^\d{12}$/.test(apar_id)) {
    return res
      .status(400)
      .json({ success: false, message: "APAAR ID must be 12 digits" });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number must be 10 digits" });
  }

  if (!/^\d{4,6}$/.test(otp)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP format" });
  }

  if (action !== "signup" && action !== "login") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid action" });
  }

  try {
    if (authMode === "demo") {
      const otpKey = `${action}:${apar_id}:${phone}`;
      const storedOtp = demoOtps.get(otpKey);

      if (!storedOtp) {
        return res.json({
          success: false,
          message: "OTP not found or already used",
        });
      }

      if (Date.now() > storedOtp.expiresAt) {
        demoOtps.delete(otpKey);

        return res.json({
          success: false,
          message: "OTP has expired",
        });
      }

      if (hashOtp(otp) !== storedOtp.otpHash) {
        return res.json({
          success: false,
          message: "OTP doesn't match",
        });
      }

      // OTP can only be used once
      demoOtps.delete(otpKey);
    } else {
      // Twilio Verify mode
      if (!twilioClient || !verifyServiceSid) {
        return res.status(500).json({
          success: false,
          message: "Twilio Verify service is not configured",
        });
      }

      const verificationCheck = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({
          to: `+91${phone}`,
          code: otp,
        });

      if (verificationCheck.status !== "approved") {
        return res.json({
          success: false,
          message: "OTP doesn't match",
        });
      }
    }
    if (action === "login") {
      const userRes = await pool.query(
        "SELECT * FROM users WHERE apar_id=$1 AND phone=$2",
        [apar_id, phone]
      );

      if (userRes.rows.length === 0) {
        return res.json({
          success: false,
          message: "APAAR ID and phone number do not match.",
        });
      }
    }

    if (action === "signup") {
      // Check again if user already exists
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE apar_id=$1 OR phone=$2",
        [apar_id, phone]
      );

      if (existingUser.rows.length > 0) {
        return res.json({
          success: false,
          message: "User already exists. Please login.",
        });
      }

      await pool.query(
        "INSERT INTO users (apar_id, phone, dob) VALUES ($1,$2,$3)",
        [apar_id, phone, dob]
      );

      return res.json({
        success: true,
        message: "Signup successful!",
      });
    } else {
      // Login
      return res.json({
        success: true,
        message: "Login successful!",
      });
    }
  } catch (err) {
    console.error("Verify OTP error:", err.message);

    if (err.code === 60200) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
