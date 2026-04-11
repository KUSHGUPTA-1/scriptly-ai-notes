const express = require("express");
const router = express.Router();
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ensure fetch is available (polyfill from app.js should handle this, but just in case)
let fetchFunction = global.fetch;
if (!fetchFunction) {
    try {
        fetchFunction = require('node-fetch');
    } catch (e) {
        console.error("fetch is not available. Please ensure node-fetch is installed.");
    }
}
const fetch = fetchFunction;

// Validate key
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing in .env");
} else {
    console.log("✅ GEMINI_API_KEY found");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of models to try in order (most preferred first)
// Trying different formats as model names may vary
const MODEL_NAMES = [
    "gemini-1.5-flash-latest",  // Latest version format
    "gemini-1.5-pro-latest",    // Latest version format
    "gemini-1.5-flash",         // Standard format
    "gemini-1.5-pro",           // Standard format
    "gemini-pro",               // Legacy
    "gemini-1.0-pro",           // Alternative format
    "gemini-1.0-pro-latest"     // Alternative latest format
];

// Helper function to list available models (for debugging)
async function listAvailableModels() {
    try {
        const models = await genAI.listModels();
        console.log("Available models:", models);
        return models;
    } catch (error) {
        console.error("Error listing models:", error);
        return null;
    }
}

router.post("/", async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage || userMessage.trim() === "") {
        return res.status(400).json({ error: "Please type a message first." });
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
            error: "Gemini API key is not configured. Please check your .env file." 
        });
    }

    // First, try to list available models to find what works
    // Prioritize free-tier models
    const FREE_TIER_MODELS = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ];
    
    // Models to exclude (premium/preview models not on free tier)
    const EXCLUDED_MODELS = [
        "gemini-2.5",
        "gemini-2.0",
        "preview",
        "exp",
        "ultra"
    ];
    
    let availableModelName = null;
    let allAvailableModels = [];
    
    try {
        console.log("Fetching available models...");
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        
        if (listResponse.ok) {
            const listData = await listResponse.json();
            const models = listData.models || [];
            allAvailableModels = models;
            
            // First, try to find a free-tier model
            for (const freeModel of FREE_TIER_MODELS) {
                const foundModel = models.find(m => {
                    const modelName = m.name?.replace('models/', '') || m.name;
                    const supportedMethods = m.supportedGenerationMethods || [];
                    return modelName === freeModel && supportedMethods.includes('generateContent');
                });
                
                if (foundModel) {
                    availableModelName = foundModel.name?.replace('models/', '') || foundModel.name;
                    console.log(`✅ Found free-tier model: ${availableModelName}`);
                    break;
                }
            }
            
            // If no free-tier model found, find any model that supports generateContent
            // but exclude premium/preview models
            if (!availableModelName) {
                console.log("No free-tier model found, searching for other available models (excluding premium)...");
                for (const model of models) {
                    const modelName = model.name?.replace('models/', '') || model.name;
                    const supportedMethods = model.supportedGenerationMethods || [];
                    
                    // Skip premium/preview models
                    const isExcluded = EXCLUDED_MODELS.some(excluded => 
                        modelName.toLowerCase().includes(excluded.toLowerCase())
                    );
                    
                    if (isExcluded) {
                        console.log(`⏭️ Skipping premium model: ${modelName}`);
                        continue;
                    }
                    
                    if (supportedMethods.includes('generateContent')) {
                        availableModelName = modelName;
                        console.log(`✅ Found available model: ${availableModelName}`);
                        break;
                    }
                }
            }
            
            // Last resort: use first model ONLY if it's not premium (but log a warning)
            if (!availableModelName && models.length > 0) {
                // Try to find any non-premium model
                for (const model of models) {
                    const modelName = model.name?.replace('models/', '') || model.name;
                    const isExcluded = EXCLUDED_MODELS.some(excluded => 
                        modelName.toLowerCase().includes(excluded.toLowerCase())
                    );
                    if (!isExcluded) {
                        availableModelName = modelName;
                        console.log(`⚠️ Using first non-premium model: ${availableModelName}`);
                        break;
                    }
                }
                
                // If still no model, log all available models for debugging
                if (!availableModelName) {
                    console.log("⚠️ All available models are premium. Available models:", 
                        models.map(m => m.name?.replace('models/', '') || m.name).join(', '));
                }
            }
        } else {
            console.log("Could not list models, status:", listResponse.status);
        }
    } catch (e) {
        console.log("Error listing models:", e.message);
    }

    // Try using REST API directly (more reliable than SDK for model compatibility)
    // Prioritize free-tier models first
    const modelsToTry = availableModelName 
        ? [availableModelName, ...FREE_TIER_MODELS.filter(m => m !== availableModelName), ...MODEL_NAMES]
        : [...FREE_TIER_MODELS, ...MODEL_NAMES];
    
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying model via REST API: ${modelName}`);
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage
                        }]
                    }]
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (reply) {
                    console.log(`✅ Success with model: ${modelName}`);
                    return res.json({ reply });
                } else {
                    console.log(`Model ${modelName} returned empty response`);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
                console.log(`Model ${modelName} failed:`, response.status, errorMessage);
                
                // Handle quota errors specifically
                if (response.status === 429) {
                    const quotaError = errorMessage.includes('quota') || errorMessage.includes('Quota');
                    if (quotaError) {
                        console.log(`⚠️ Model ${modelName} is not available on free tier (quota exceeded)`);
                        // Continue to next model if it's a quota error
                        continue;
                    }
                }
                
                // If it's not a 404 or 429 (quota), don't try other models
                if (response.status !== 404 && response.status !== 429) {
                    break;
                }
            }
        } catch (restError) {
            console.log(`REST API error for ${modelName}:`, restError.message);
        }
    }
    
    // Fallback: Try SDK with a free-tier model (skip premium models)
    // Only try SDK if we have a free-tier model, not premium/preview models
    if (availableModelName) {
        const isPremiumModel = EXCLUDED_MODELS.some(excluded => 
            availableModelName.toLowerCase().includes(excluded.toLowerCase())
        );
        
        if (!isPremiumModel) {
            try {
                console.log(`Trying SDK with model: ${availableModelName}`);
                const model = genAI.getGenerativeModel({ model: availableModelName });
                const result = await model.generateContent(userMessage);
                const reply = result.response.text();
                console.log(`✅ SDK success with model: ${availableModelName}`);
                return res.json({ reply });
            } catch (sdkError) {
                console.log(`SDK also failed:`, sdkError.message);
                // If SDK fails with quota error, try free-tier models directly
                if (sdkError.message.includes('quota') || sdkError.message.includes('Quota')) {
                    console.log("SDK quota error, trying free-tier models directly...");
                }
            }
        } else {
            console.log(`⚠️ Skipping SDK with premium model: ${availableModelName}`);
        }
    }
    
    // Last resort: Try free-tier models directly via SDK
    for (const freeModel of FREE_TIER_MODELS) {
        try {
            console.log(`Trying free-tier model via SDK: ${freeModel}`);
            const model = genAI.getGenerativeModel({ model: freeModel });
            const result = await model.generateContent(userMessage);
            const reply = result.response.text();
            console.log(`✅ SDK success with free-tier model: ${freeModel}`);
            return res.json({ reply });
        } catch (sdkError) {
            // Continue to next model
            if (!sdkError.message.includes('404') && !sdkError.message.includes('not found')) {
                console.log(`Free-tier model ${freeModel} failed:`, sdkError.message);
            }
        }
    }
    
    // If we get here, all methods failed
    console.error("🔥 All methods failed to generate response");
    
    // Check if the last error was a quota error
    let errorMessage = "Unable to connect to Gemini API.";
    
    if (availableModelName && availableModelName.includes('2.5') || availableModelName?.includes('preview')) {
        errorMessage = "The selected model is not available on the free tier. Please wait a moment and try again, or the system will automatically retry with a free-tier model.";
    } else {
        errorMessage = "Unable to connect to Gemini API. Please verify your API key is valid and has access to Gemini models. Check https://makersuite.google.com/app/apikey";
    }
    
    return res.status(500).json({
        error: errorMessage
    });
});

module.exports = router;
