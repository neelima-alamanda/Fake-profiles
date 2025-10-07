const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const path = require("path");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "apar_auth",
  password: "your_postgresql_password",
  port: 5432,
});

// Twilio client
let twilioClient = null;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM
) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Generate 4-digit numeric OTP
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
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
    return res.status(400).json({ success: false, message: "APAAR ID must be 12 digits" });
  if (!/^\d{10}$/.test(phone))
    return res.status(400).json({ success: false, message: "Phone number must be 10 digits" });

  if (action === "signup") {
    if (!dob || getAge(dob) < 15) {
      return res.json({ success: false, message: "Age must be at least 15 years" });
    }
  }

  try {
    // Check if user exists
    const userRes = await pool.query(
      "SELECT * FROM users WHERE apar_id=$1 OR phone=$2",
      [apar_id, phone]
    );

    if (action === "signup" && userRes.rows.length > 0) {
      const existing = userRes.rows[0];
      if (existing.apar_id === apar_id) {
        return res.json({ success: false, message: "APAAR ID already exists. Please login." });
      }
      if (existing.phone === phone) {
        return res.json({ success: false, message: "Phone number already exists. Please login." });
      }
    }

    if (action === "login" && userRes.rows.length === 0) {
      return res.json({ success: false, message: "No account found. Please signup." });
    }

    const otp = generateOtp();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP
    await pool.query(
      "INSERT INTO otps (apar_id, phone, otp, expires_at) VALUES ($1,$2,$3,$4)",
      [apar_id, phone, otp, expires_at]
    );

    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_FROM,
        to: `+91${phone}`,
      });
    } else {
      console.log(`(Test mode) OTP for ${phone}: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---- VERIFY OTP ----
app.post("/verify-otp", async (req, res) => {
  const { apar_id, phone, otp, dob, action } = req.body;

  if (!apar_id || !phone || !otp)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    // Get latest OTP
    const otpRecord = await pool.query(
      "SELECT * FROM otps WHERE apar_id=$1 AND phone=$2 ORDER BY created_at DESC LIMIT 1",
      [apar_id, phone]
    );

    if (otpRecord.rows.length === 0) return res.json({ success: false, message: "No OTP found" });

    const row = otpRecord.rows[0];
    if (new Date(row.expires_at) < new Date())
      return res.json({ success: false, message: "OTP expired" });
    if (row.otp !== otp)
      return res.json({ success: false, message: "OTP doesn’t match" });

    if (action === "signup") {
      // Check again if user already exists
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE apar_id=$1 OR phone=$2",
        [apar_id, phone]
      );

      if (existingUser.rows.length > 0) {
        return res.json({ success: false, message: "User already exists. Please login." });
      }

      await pool.query(
        "INSERT INTO users (apar_id, phone, dob) VALUES ($1,$2,$3)",
        [apar_id, phone, dob]
      );

      return res.json({ success: true, message: "Signup successful!" });
    } else {
      // Login
      return res.json({ success: true, message: "Login successful!" });
    }
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
