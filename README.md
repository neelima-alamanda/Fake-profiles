# 🔍 Fake Profile Detection System

A backend-driven system designed to prevent fake accounts on digital platforms by implementing identity-based verification using APAAR ID and mobile authentication.

---

## 🚀 Overview

Fake profiles are a major challenge on social media and online platforms, leading to misuse, fraud, and reduced trust.  

This project proposes a solution by enforcing **unique identity verification**, ensuring that each user can create only one authentic account.

By linking accounts with verified identity details, the system enhances **security, accountability, and platform reliability**.

---

## 🎯 Key Features

- 🔐 Secure user registration system  
- 🆔 Identity verification using APAAR ID  
- 📱 Mobile number authentication  
- 🚫 Prevention of multiple fake accounts  
- 📊 Backend REST API for user management  
- 🌐 Simple frontend interface to view user profiles  
- 🔍 Improved user traceability and accountability  

---

## 🛠️ Tech Stack

### ⚙️ Backend
- Node.js  
- Express.js  

### 🗄️ Database
- SQL  

### 🌐 Frontend
- HTML  
- JavaScript  

---

## 🧠 System Design

The system works in the following flow:

1. User registers with:
   - APAAR ID  
   - Mobile number  

2. System verifies:
   - Identity uniqueness  
   - Existing records in database  

3. If valid:
   - Account is created  

4. If duplicate:
   - Registration is blocked  

👉 This ensures **one user → one account**

---

## 📂 Project Structure

```bash
Fake-profiles/
├── public/            # Frontend files
├── server.js          # Backend server
├── db.sql             # Database schema
├── package.json       # Dependencies
├── README.md          # Documentation

⚙️ Installation & Setup

Clone the repository:
git clone https://github.com/BhanuTeja1705/Fake-profiles.git

Navigate to project:
cd Fake-profiles

Install dependencies:
npm install

Start the server:
node server.js

Open in browser:
http://localhost:3000


🎯 Project Objective

The goal of this project is to demonstrate how identity verification systems can significantly reduce fake profiles and improve user trust on online platforms.

📈 Future Enhancements

🔐 OTP-based mobile verification

🤖 AI-based fake profile detection

🌐 Integration with real government identity APIs

📊 Admin dashboard with analytics

🔎 Behavioral analysis for fraud detection

👨‍💻 Author


Goriparthi Bhanu Teja

⭐ If you found this project useful, consider giving it a star!
