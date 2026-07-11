# Kadhaipomaa - Backend Server

This is the Node.js / Express / Socket.io backend server for the Kadhaipomaa anonymous chat application. It handles real-time messaging, user matching, and IP moderation.

## Features
- **Real-Time Websockets**: Powered by `socket.io` for instant message delivery and typing indicators.
- **Random Matching**: Connects users with strangers instantly.
- **Profanity Filter**: Includes automatic filtering for bad words with a 3-strike temporary ban system.
- **Admin Dashboard API**: Protected endpoints for real-time monitoring of connected users and IP management.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the server locally:**
   ```bash
   npm start
   ```
   The server will start running on port `8088`.

## Environment Variables
- `ADMIN_PASSWORD`: (Required for Admin dashboard) A secure password to access moderation stats.

## Deployment
This project is configured to run easily on platforms like Render or Heroku. Make sure to set the `ADMIN_PASSWORD` in your hosting provider's environment variables.

---

## 🛑 Copyright & Usage Restriction
© 2026 Tanishka R (Kadhaipomaa). All Rights Reserved.

This repository and its source code are provided for portfolio evaluation and recruiter review ONLY.

You are strictly prohibited from copying, cloning, modifying, distributing, or hosting this application (in whole or in part) for personal, educational, or commercial use without explicit written permission from the author.
