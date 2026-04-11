const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user'); // adjust path if needed
const noteRoutes = require('./routes/note');
dotenv.config();
const cors = require('cors');
const app = express();
const passport = require('passport');
const session = require('express-session');
const User = require('./models/User');

// Polyfill global.fetch and AbortController when running on Node versions
// that don't provide them (Node < 18). This allows route code using fetch/AbortController
// to work without changing the route implementation.
try {
    if (typeof fetch === 'undefined') {
        // node-fetch v2 (CommonJS)
        global.fetch = require('node-fetch');
    }
} catch (e) {
    // ignore if not installed; error will surface when calling fetch
}
try {
    if (typeof AbortController === 'undefined') {
        global.AbortController = require('abort-controller');
    }
} catch (e) {
    // ignore
}

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("DB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
        console.log("server connected at port 5000");
    });

})
.catch((err) => {
    console.log("DB error:", err);
});


app.use(express.json());
// app.use(cors());
app.use(cors({
    // allow requests from any origin in development; change to your frontend URL in production
    origin: true,
    credentials: true
}));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);
const transcribeRoutes = require('./routes/transcribe');
app.use('/api/transcribe', transcribeRoutes);
const summaryRoutes = require('./routes/summary');
app.use('/api/summary', summaryRoutes);
const keywordsRoutes = require('./routes/keywords');
app.use('/api/keywords', keywordsRoutes);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Basic route
app.get('/', (req, res) => {
    res.send('API is running');
});


