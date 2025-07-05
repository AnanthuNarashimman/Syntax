// index.js - Your complete Node.js server setup file

// --- 1. Core Node.js and Express Imports ---
const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const security_key = process.env.SECURITY_KEY

// --- 2. Firebase Admin SDK Initialization ---
const admin = require('firebase-admin');
const serviceAccount = require(security_key);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- 3. Password Hashing Utilities ---
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string.');
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password due to a server error.');
    }
}

async function comparePasswords(plainPassword, hashedPassword) {
    if (!plainPassword || typeof plainPassword !== 'string' || !hashedPassword || typeof hashedPassword !== 'string') {
        throw new Error('Both plainPassword and hashedPassword must be non-empty strings for comparison.');
    }
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error('Error comparing password:', error);
        throw new Error('Failed to compare password due to a server error.');
    }
}

// --- 4. Authentication Service Logic (Modified for JWT) ---

async function loginAdminUser(email, password) {
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        throw new Error('Email and password are required and must be strings.');
    }

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            throw new Error('Invalid credentials.');
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;

        const isPasswordValid = await comparePasswords(password, userData.hashedPassword);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials.');
        }

        if (userData.isAdmin !== true) {
            throw new Error('Access denied: User is not an authorized administrator.');
        }

        const payload = {
            userId: userId,
            userName: userData.userName,
            email: userData.email,
            isAdmin: userData.isAdmin
        };

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured in environment variables.');
        }

        const tokenOptions = {
            expiresIn: '1h'
        };

        const token = jwt.sign(payload, jwtSecret, tokenOptions);

        return {
            id: userId,
            email: userData.email,
            userName: userData.userName,
            isAdmin: userData.isAdmin,
            token: token,
            message: 'Admin login successful!'
        };

    } catch (error) {
        console.error('Admin login attempt failed:', error.message);
        if (error.message.includes('Invalid credentials') || error.message.includes('Access denied') || error.message.includes('User is not an authorized administrator')) {
            throw error;
        }
        throw new Error('An unexpected server error occurred during login. Please try again.');
    }
}

// --- 5. Express App Setup and Middleware Configuration ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// --- 6. Middleware for Admin-Only Route Protection (Modified for JWT) ---
function requireAdminAuth(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured on the server.');
        }

        const decoded = jwt.verify(token, jwtSecret);

        req.user = decoded;

        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Admin access required.' });
        }

        next();

    } catch (error) {
        console.error('JWT verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
        }
        return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
}

// --- 7. API Routes Definition ---

app.post('/api/auth/admin-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { id, email: userEmail, isAdmin, token } = await loginAdminUser(email, password);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60,
            sameSite: 'Lax',
            path: '/'
        });

        res.status(200).json({
            message: 'Admin login successful!',
            user: { id: id, email: userEmail, isAdmin: isAdmin }
        });

    } catch (error) {
        console.error('Admin login failed:', error.message);
        res.status(401).json({ message: error.message || 'Authentication failed. Please check your credentials.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully.' });
});

app.get('/api/admin/manage-quizzes', requireAdminAuth, (req, res) => {
    res.status(200).json({
        message: `Welcome to the Admin Quiz Management Panel, User ID: ${req.user.userId}!`,
        data: {
            availableQuizzes: [
                { id: 'quiz_node_basics', title: 'Node.js Fundamentals', status: 'Draft' },
                { id: 'quiz_security_pro', title: 'Web Security Master', status: 'Published' }
            ],
            pendingReviews: 5
        }
    });
});

app.get('/api/user/profile', (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Please log in to view your profile.' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured on the server.');
        }
        const decoded = jwt.verify(token, jwtSecret);

        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admins use a different profile view.' });
        }

        res.status(200).json({
            userName: decoded.userName,
            mail: decoded.email,
        });

    } catch (error) {
        console.error('Token verification failed for user profile:', error.message);
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
});

app.post('/api/verify/pass-verify', async (req, res) => {
    try {
        const { currentPassword } = req.body;

        if (!currentPassword) {
            return res.status(400).json({ message: 'Current password is required.' });
        }

        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: Please log in.' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {

            throw new Error('Server configuration error: JWT_SECRET not set.');
        }

        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        if (!userId) {
            return res.status(400).json({ message: 'Invalid token: User ID missing.' });
        }

        const userDocRef = db.collection('users').doc(userId);
        const snapshot = await userDocRef.get();

        if (!snapshot.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const userData = snapshot.data();
        const hashedPassword = userData.hashedPassword;

        if (!hashedPassword) {
            console.error(`User ${userId} has no hashed password in DB.`);
            return res.status(500).json({ message: 'Server error: User password data is corrupted.' });
        }

        console.log(currentPassword);

        const isPasswordValid = await comparePasswords(currentPassword, hashedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        res.status(200).json({
            'PasswordMatch': true
        });

    } catch (error) {
        console.error('Password Verification failed:', error.message);


        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
        }
        if (error.message.includes('JWT_SECRET not set')) {
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        res.status(500).json({ message: error.message || 'An unexpected server error occurred.' });
    }
});


app.post('/api/update/pass-update', async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ messgae: 'New Password is required.' });
        }

        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: PLease log in." });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('Server Configuration error: JWT_SECRET not set.');
        }

        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        if (!userId) {
            return res.status(400).json({ message: 'Invalid token: User ID missing.' });
        }

        const saltRounds = 10;

        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);


        const userDocRef = db.collection('users').doc(userId);

        await userDocRef.update({
            hashedPassword: newHashedPassword
        });

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        console.error('Error updating password in Firestore:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
        }
        
        res.status(500).json({ message: 'Failed to update password.' });

    }
});


// --- 8. Start the Express Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your API at http://localhost:${PORT}`);
    console.log(`Current time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log('\n--- IMPORTANT CHECKLIST ---');
    console.log('1. Ensure your Firebase `serviceAccountKey.json` is correctly placed or configured.');
    console.log('2. Ensure your `.env` file is present and correctly configured with `JWT_SECRET` AND `FRONTEND_URL`.');
    console.log('3. Ensure your Firestore `users` collection has test admin/student data with `hashedPassword` and `isAdmin` flags (`isAdmin: true`).');
    console.log('4. Remember to configure your FRONTEND DEVELOPMENT PROXY if your frontend is not on the same port!');
});
