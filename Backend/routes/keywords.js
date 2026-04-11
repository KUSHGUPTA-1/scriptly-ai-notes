const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Please provide text to extract keywords from" });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemma-3-1b-it"   // FIXED MODEL
        });

        const prompt = `
        Extract the most important keywords from the following text.
        Return them as a comma-separated list only (no explanation).
        
        Text:
        ${text}
        `;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });

        const rawKeywords =
            result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Format keywords cleanly
        const keywords = rawKeywords
            .replace(/\n/g, "")
            .split(",")
            .map(k => k.trim())
            .filter(k => k.length > 0);

        return res.json({ keywords });

    } catch (error) {
        console.error("Keyword extraction error:", error);

        return res.status(500).json({
            error: "Failed to extract keywords. " + (error.message || "")
        });
    }
});

module.exports = router;
