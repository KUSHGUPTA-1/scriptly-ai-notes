const express = require('express');
const User = require('../models/User');
const passport = require('passport');
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = new User({ email });
        await User.register(user, password);
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login user
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json({ 
                message: "Logged in successfully", 
                user: { id: user._id, email: user.email } 
            });
        });
    })(req, res, next);
});

// Get current user
router.get('/current', (req, res) => {
    if (req.user) {
        return res.json({ 
            user: { id: req.user._id, email: req.user.email } 
        });
    } else {
        return res.status(401).json({ error: "Not authenticated" });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;
