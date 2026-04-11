
// ---- BACKEND ENDPOINTS ----
const BASE_URL = "http://localhost:5000/api";

// ---- DOM ELEMENTS ----
const textArea = document.getElementById("voiceText");
const summaryBox = document.getElementById("summaryText");
const keywordBox = document.getElementById("keywordsText");

// ---- RECORDING STATE ----
let recording = false;
let mediaRecorder;
let audioChunks = [];
let recognition = null;
let finalTranscript = "";

// ---- INITIALIZE: Check if user is logged in ----
(async function init() {
    try {
        const userResponse = await fetch(`${BASE_URL}/users/current`, {
            credentials: 'include'
        });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user?.id) {
                localStorage.setItem('userId', userData.user.id);
            }
        } else {
            // Not logged in - redirect to login
            const currentPath = window.location.pathname;
            if (currentPath.includes('workspace.html')) {
                // Only redirect if we're on workspace page
                // window.location.href = "login.html";
            }
        }
    } catch (e) {
        console.log("Could not verify user session:", e);
    }
})();

// ----------------------- START RECORDING -----------------------
async function startRecording() {
    if (recording) return;
    recording = true;

    // Show status in text box instead of summary area
    textArea.value = "";
    textArea.placeholder = "🎙 Listening...";
    finalTranscript = "";

    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            textArea.value = finalTranscript + interimTranscript;
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'no-speech') {
                textArea.placeholder = "No speech detected. Try again.";
            } else {
                textArea.placeholder = "Error: " + event.error;
            }
            recording = false;
        };

        recognition.onend = () => {
            if (recording) {
                // If still supposed to be recording, restart
                try {
                    recognition.start();
                } catch (e) {
                    console.log("Recognition already started or ended");
                }
            }
        };

        try {
            recognition.start();
            console.log("Speech recognition started...");
        } catch (error) {
            console.error("Failed to start recognition:", error);
            textArea.placeholder = "❌ Speech recognition not available.";
            recording = false;
        }
    } else {
        // Fallback to MediaRecorder if Web Speech API not available
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.start();
            console.log("Recording started (fallback mode)...");
            textArea.placeholder = "🎙 Recording... (Note: Transcription requires Web Speech API)";
        } catch (error) {
            console.error("Microphone access failed:", error);
            textArea.placeholder = "❌ Microphone permission denied.";
            recording = false;
        }
    }
}

// ----------------------- STOP RECORDING -----------------------
async function stopRecording() {
    if (!recording) return;
    recording = false;

    textArea.placeholder = "⏳ Processing...";

    // Stop Web Speech API recognition if active
    if (recognition) {
        recognition.stop();
        recognition = null;
        // Use the final transcript
        if (finalTranscript) {
            textArea.value = finalTranscript.trim();
        }
        textArea.placeholder = "Your transcribed text will appear here...";
        return;
    }

    // Fallback: Stop MediaRecorder if used
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();

        mediaRecorder.onstop = async () => {
            console.log("Recording stopped.");

            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

            // ---- SEND TO BACKEND (fallback) ----
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            try {
                const response = await fetch(`${BASE_URL}/transcribe`, {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();
                if (data.transcript) {
                    textArea.value = data.transcript;
                }
                textArea.placeholder = "Your transcribed text will appear here...";

            } catch (error) {
                console.error("❌ Error sending audio:", error);
                textArea.placeholder = "❌ Error processing audio. Please use a browser with Web Speech API support.";
            }
        };
    } else {
        textArea.placeholder = "Your transcribed text will appear here...";
    }
}

// ----------------------- GENERATE SUMMARY -----------------------
async function generateSummary() {
    const text = textArea.value.trim();
    if (!text) {
        alert("Please record or enter text first!");
        return;
    }

    summaryBox.innerText = "⏳ Generating summary...";

    try {
        const response = await fetch(`${BASE_URL}/summary`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        summaryBox.innerText = data.summary || "⚠ No summary returned.";

    } catch (error) {
        summaryBox.innerText = "❌ Error generating summary. Please check your connection.";
        console.error(error);
    }
}

// ----------------------- EXTRACT KEYWORDS -----------------------
async function extractKeywords() {
    const text = textArea.value.trim();
    if (!text) {
        alert("Please record or enter text first!");
        return;
    }

    keywordBox.innerText = "⏳ Extracting key points...";

    try {
        const response = await fetch(`${BASE_URL}/keywords`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.keywords && Array.isArray(data.keywords)) {
            keywordBox.innerText = data.keywords.join(", ") || "⚠ No keywords found.";
        } else {
            keywordBox.innerText = "⚠ No keywords found.";
        }

    } catch (error) {
        keywordBox.innerText = "❌ Error extracting keywords. Please check your connection.";
        console.error(error);
    }
}


// // ----------------------- SAVE NOTE -----------------------
async function saveNote() {
    const text = textArea.value.trim();

    if (!text) {
        alert("Please record or enter text first!");
        return;
    }

    // keywords extract
    const keywordsText = keywordBox.innerText;
    let keywords = [];

    if (
        keywordsText &&
        !keywordsText.includes("will appear here") &&
        !keywordsText.includes("⚠")
    ) {
        keywords = keywordsText.split(",").map(k => k.trim()).filter(k => k);
    }

    // userId
    let userId = localStorage.getItem("userId");

    if (!userId) {
        alert("❌ User not logged in!");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                owner: userId,
                content: text,
                keywords: keywords
            }),
            credentials: "include"
        });

        const data = await response.json();

        if (data.error) {
            alert("❌ " + data.error);
        } else {
            alert("✅ Note saved successfully!");
            console.log("Saved:", data);
        }

    } catch (error) {
        console.error(error);
        alert("❌ Error saving note");
    }
}