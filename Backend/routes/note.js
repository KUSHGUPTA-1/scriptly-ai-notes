const express = require('express');
const Note = require('../models/Note');
const router = express.Router();

// Create a note
router.post('/', async (req, res) => {
    const { owner, content, keywords } = req.body;
    try {
        const note = await Note.create({ owner, content, keywords });
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all notes of a user
router.get('/:ownerId', async (req, res) => {
    try {
        const notes = await Note.find({ owner: req.params.ownerId });
        res.json(notes);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

// All the notes are saved in the database, and the user can view all their notes in the workspace page. The note content and keywords are stored in the Note model, which is linked to the User model through the owner field.
// The saveNote function in the frontend sends a POST request to this route with the note content, keywords, and user ID. The backend then creates a new Note document in the database with this information. When the user visits the workspace page, a GET request is sent to retrieve all notes for that user, which are then displayed on the page.