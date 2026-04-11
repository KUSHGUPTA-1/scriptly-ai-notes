# 🎤 Scriptly — AI Powered Speech-to-Notes App

## 🚀 Overview

**Scriptly** is a full-stack AI-powered web application that converts speech into structured notes. It allows users to record voice, transcribe it into text, generate summaries, extract key points, and save notes securely in a database.

This project demonstrates integration of **Speech Recognition, AI APIs, and full-stack development**.

---

## ✨ Features

### 🎙 Speech-to-Text

* Real-time voice recording
* Converts speech into readable text
* Uses browser Web Speech API (with fallback support)

### 📄 AI Summary Generation

* Generates concise summaries from long text
* Powered by Gemini API

### 🔑 Keyword Extraction

* Extracts important key points automatically

### 💾 Save Notes

* Save notes with:

  * Content
  * Keywords
  * User reference
* Stored in MongoDB database

### 🔐 Authentication System

* User Registration
* Login with session handling
* Persistent user sessions

---

## 🛠 Tech Stack

### 🔹 Frontend

* HTML
* CSS
* JavaScript
* Web Speech API

### 🔹 Backend

* Node.js
* Express.js

### 🔹 Database

* MongoDB (Local)

### 🔹 Authentication

* Passport.js
* Express-session

### 🔹 AI Integration

* Gemini API (for summary & keywords)

---

## 📁 Project Structure

```
Scriptly/
│
├── Backend/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   ├── .env
│
├── Frontend/
│   ├── login.html
│   ├── register.html
│   ├── workspace.html
│   ├── workspace.js
│   ├── styles.css
│
├── .gitignore
├── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 1. Clone the repository

```bash
git clone https://github.com/yourusername/scriptly-ai-notes.git
cd scriptly-ai-notes
```

---

### 🔹 2. Install dependencies

```bash
cd Backend
npm install
```

---

### 🔹 3. Setup Environment Variables

Create a `.env` file inside Backend:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/speech_notes
GEMINI_API_KEY=your_api_key_here
```

---

### 🔹 4. Start MongoDB

Make sure MongoDB is running:

```bash
mongod
```

---

### 🔹 5. Run Backend Server

```bash
node app.js
```

Server runs at:

```
http://localhost:5000
```

---

### 🔹 6. Run Frontend

Open in browser:

```
Frontend/login.html
```

---

## 🔗 API Endpoints

### 🔹 User Routes

* `POST /api/users/register` → Register user
* `POST /api/users/login` → Login user
* `GET /api/users/current` → Get current user

### 🔹 Notes

* `POST /api/notes` → Save note
* `GET /api/notes/:ownerId` → Get user notes

### 🔹 AI Features

* `POST /api/summary` → Generate summary
* `POST /api/keywords` → Extract keywords
* `POST /api/transcribe` → Audio transcription (fallback)

---

## 🧪 How to Use

1. Register a new account
2. Login
3. Go to workspace
4. Click **Start Recording**
5. Speak → text appears
6. Generate summary & keywords
7. Click **Save Note**

---

## 📸 Screenshots (Add later)

* Login Page
* Workspace UI
* Saved Notes

---

## 🔒 Security Notes

* `.env` file is ignored using `.gitignore`
* API keys are not exposed
* Session-based authentication is used

---

## 🚀 Future Improvements

* 📂 View Saved Notes page
* 🗑 Delete notes
* ✏ Edit notes
* ☁ Deploy to cloud (Render / Vercel)
* 📥 Export notes (PDF, DOCX)
* 🌍 Multi-language support

---

## 💡 Learning Outcomes

* Full-stack development
* REST API design
* MongoDB integration
* Authentication using Passport.js
* AI API integration
* Speech recognition implementation

---

## 👨‍💻 Author

**Kush Gupta**

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and share it!

---
