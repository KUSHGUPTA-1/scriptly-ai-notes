const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/",async(req, res)=>{
    const{text}=req.body;
    if(!text || text.trim() === ""){
        return res.status(400).json({ error: "Please provide text to summarize" });
    }
    try{
        const model=genAI.getGenerativeModel({
            model:"gemma-3-1b-it"
        });
        const prompt = `Summarize this text concisely:\n\n${text}`;
        const result = await model.generateContent(prompt);
        const summary = result.response.text();
        return res.json({ summary });

    } 
    catch(error){
        console.error("Summary generation error:", error);
        return res.status(500).json({
            error: "Failed to generate summary. " + (error.message || "")
        });
    }
});

module.exports = router;
