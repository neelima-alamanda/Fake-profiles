# 🔍 Fake Profile Detection System

A web-based authentication system designed to reduce duplicate and unauthorized accounts by verifying users through their APAAR ID and mobile number using OTP-based authentication.

---

## 📌 Project Context

This project was originally developed as a team project.

This repository is my fork of the team project, where I worked on improving the authentication flow, OTP handling, validation, testing, database configuration, and documentation.

---

## 🚀 Overview

Fake and duplicate accounts can reduce trust on online platforms.

This project demonstrates an identity-based authentication flow where users provide:

- APAAR ID
- Mobile number
- Date of birth during signup

The system validates the submitted details, checks existing users in PostgreSQL, and supports OTP-based mobile verification.

After successful authentication, the user is redirected to the selected platform.

---

## 🎯 Key Features

- 🔐 User signup and login
- 🆔 12-digit APAAR ID validation
- 📱 10-digit mobile number validation
- 🎂 Minimum age validation during signup
- 🔢 OTP-based mobile verification
- 📲 Twilio Verify integration for SMS OTP
- 🧪 Demo OTP mode for testing without SMS services
- 🚫 Duplicate APAAR ID prevention
- 🚫 Duplicate phone number prevention
- 🔗 APAAR ID and phone number matching during login
- 🗄️ PostgreSQL database integration
- 🌐 HTML, CSS, and JavaScript frontend
- ⚙️ Environment-variable based configuration
- 🔒 Sensitive credentials excluded using `.gitignore`
- 🔗 Platform-based redirection after successful authentication

---

## 🛠️ Tech Stack

### ⚙️ Backend

- Node.js
- Express.js
- Body-parser

### 🗄️ Database

- PostgreSQL
- `pg` Node.js library

### 🔐 Authentication

- Twilio Verify
- SMS OTP verification
- Demo OTP authentication
- Node.js `crypto` for random OTP generation and hashing

### 🌐 Frontend

- HTML
- CSS
- JavaScript

### ⚙️ Configuration

- dotenv
- `.env` environment variables

---

## 🧠 Authentication Flow

### Signup

```text
User selects a platform
        ↓
Signup form
        ↓
APAAR ID + Phone + DOB
        ↓
Input validation
        ↓
Check duplicate APAAR ID / Phone
        ↓
OTP generation / Twilio Verify
        ↓
User enters OTP
        ↓
OTP verification
        ↓
User inserted into PostgreSQL
        ↓
Signup successful
        ↓
Redirect to selected platform
```

### Login

```text
User selects a platform
        ↓
Login form
        ↓
APAAR ID + Phone
        ↓
Check APAAR ID + Phone match
        ↓
OTP generation / Twilio Verify
        ↓
User enters OTP
        ↓
OTP verification
        ↓
Login successful
        ↓
Redirect to selected platform
```

---

## 🔐 Authentication Modes

The application supports two OTP authentication modes using the `AUTH_MODE` environment variable.

### Twilio Mode

```text
AUTH_MODE=twilio
        ↓
Twilio Verify
        ↓
Real SMS OTP
        ↓
User enters OTP
        ↓
Twilio verifies OTP
        ↓
Authentication continues
```

Twilio mode is intended for environments where an active Twilio Verify service and available SMS/Verify resources are configured.

### Demo Mode

```text
AUTH_MODE=demo
        ↓
Backend generates 6-digit OTP
        ↓
OTP is hashed and stored temporarily
        ↓
User enters OTP
        ↓
Backend verifies OTP
        ↓
Authentication continues
```

Demo mode allows the complete authentication flow to be demonstrated without depending on SMS credits.

---

## 📋 Validation Rules

### Signup

- APAAR ID must contain exactly 12 digits.
- Phone number must contain exactly 10 digits.
- User must be at least 15 years old.
- APAAR ID must not already exist.
- Phone number must not already exist.
- A valid OTP is required.

### Login

- APAAR ID must contain exactly 12 digits.
- Phone number must contain exactly 10 digits.
- The APAAR ID and phone number must belong to the same account.
- A valid OTP is required.

---

## 📂 Project Structure

```text
Fake-profiles/
│
├── public/
│   ├── images/
│   ├── index.html
│   ├── login.html
│   └── connected.html
│
├── server.js
├── db.sql
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
└── README.md
```

> `.env` contains local configuration and secrets and should not be committed to GitHub.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BhanuTeja1705/Fake-profiles.git
```

### 2. Navigate to the Project

```bash
cd Fake-profiles
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create the PostgreSQL Database

Create a PostgreSQL database named:

```text
apar_auth
```

Then run the SQL schema from:

```text
db.sql
```

The schema creates the `users` table required by the application.

---

## 🔐 Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as a template:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apar_auth
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

AUTH_MODE=demo
```

### Authentication Mode Configuration

For real SMS OTP authentication:

```env
AUTH_MODE=twilio
```

For local or demo authentication without SMS:

```env
AUTH_MODE=demo
```

Never commit the actual `.env` file or Twilio credentials to GitHub.

---

## ▶️ Run the Application

Start the server:

```bash
node server.js
```

The application will run at:

```text
http://localhost:3000
```

Open the URL in a browser to start the authentication flow.

---

## 🧪 Testing

The authentication flow was tested locally with:

- Valid signup flow
- Valid login flow
- Twilio OTP delivery
- Correct Twilio OTP verification
- Demo OTP generation
- Correct Demo OTP verification
- Invalid OTP handling
- OTP expiration
- One-time OTP usage logic
- Duplicate phone validation
- Duplicate APAAR ID validation
- Invalid APAAR ID validation
- Invalid phone validation
- APAAR ID and phone mismatch during login
- PostgreSQL user insertion
- Platform redirection

The Twilio trial account used during development may have limited or exhausted SMS/Verify resources. Demo mode allows the authentication flow to remain testable without SMS credits.

A live deployment using real SMS OTP requires an active Twilio account with available Verify resources.

---

## 👨‍💻 My Contribution

This project was originally developed as a team project. I worked on my fork and contributed to:

- 🔐 Improved APAAR ID, phone number, OTP, and authentication validation.
- 🔗 Fixed login validation to ensure APAAR ID and phone number belong to the same account.
- 🚫 Improved duplicate APAAR ID and phone number handling during signup.
- 🔢 Implemented Demo OTP mode for testing without SMS credits.
- 🛡️ Added OTP hashing, 5-minute expiry, invalid OTP handling, and one-time-use logic.
- 🗄️ Moved database credentials to environment variables and documented the PostgreSQL schema.
- 🧪 Tested signup, login, OTP verification, validation errors, database persistence, and redirects.
- 📝 Updated project documentation and setup instructions.

---

## 🔒 Security Notes

- Database credentials are loaded through environment variables.
- Twilio credentials are stored in `.env`.
- `.env` is excluded from Git using `.gitignore`.
- SQL queries use parameterized values.
- Demo OTPs are stored only as SHA-256 hashes in memory.
- Demo OTPs expire after 5 minutes.
- Verified Demo OTPs are deleted after successful verification.
- Sensitive credentials should never be committed to the repository.

---

## 📈 Future Enhancements

- 🔐 Production authentication/session management
- 👤 User profile management
- 📊 Admin dashboard
- 🔎 Fraud and duplicate-account analytics
- 🤖 AI-assisted fake-profile detection
- 📱 Additional identity verification methods
- ☁️ Production cloud deployment
- 🧪 Automated API testing
- 🗃️ Persistent OTP storage using a dedicated cache such as Redis

---

## ⭐ Project Note

This repository represents my work and improvements on a team-developed project. The contribution section documents the authentication, OTP, database configuration, testing, and documentation work I personally carried out in this fork.
