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

async function loginSuperAdminUser(email, password) {
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

        if (userData.isSuper !== true) {
            throw new Error('Access denied: User is not a super administrator.');
        }

        const payload = {
            userId: userId,
            userName: userData.username,
            email: userData.email,
            isSuper: userData.isSuper
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
            isSuper: userData.isSuper,
            token: token,
            message: 'Super Admin login successful!'
        };

    } catch (error) {
        console.error('Super Admin login attempt failed:', error.message);
        if (error.message.includes('Invalid credentials') || error.message.includes('Access denied') || error.message.includes('User is not a super administrator')) {
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

function requireSuperAdminAuth(req, res, next) {
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

        if (!req.user.isSuper) {
            return res.status(403).json({ message: 'Forbidden: Super Admin access required.' });
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

app.post('/api/auth/super-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { id, email: userEmail, isSuper, token } = await loginSuperAdminUser(email, password);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60,
            sameSite: 'Lax',
            path: '/'
        });

        res.status(200).json({
            message: 'Super Admin login successful!',
            user: { id: id, email: userEmail, isSuper: isSuper }
        });

    } catch (error) {
        console.error('Super Admin login failed:', error.message);
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

// --- 8. Contest Management Helper Functions ---

async function handleQuizCreation(req, res, data) {
    try {
        const { contestTitle, contestDescription, duration, numberOfQuestions, pointsPerProgram, questions, contestType, contestMode, topicsCovered, allowedDepartments } = data;

        // Validate quiz questions structure
        if (!Array.isArray(questions) || questions.length !== numberOfQuestions) {
            return res.status(400).json({ 
                message: 'Quiz questions must be an array with length matching numberOfQuestions.' 
            });
        }

        // Validate each quiz question
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.question || !Array.isArray(question.options) || question.options.length !== 4 || !question.correctAnswer) {
                return res.status(400).json({ 
                    message: `Question ${i + 1} is incomplete. Each question must have a question text, 4 options, and a correct answer.` 
                });
            }
            
            // Validate that correct answer exists in options
            if (!question.options.includes(question.correctAnswer)) {
                return res.status(400).json({ 
                    message: `Question ${i + 1}: Correct answer must be one of the provided options.` 
                });
            }
        }

        console.log('Creating quiz with data:', {
            contestTitle,
            contestDescription,
            contestType,
            contestMode,
            numberOfQuestions,
            pointsPerProgram
        });

        const eventData = {
            eventTitle: contestTitle,
            eventDescription: contestDescription,
            durationMinutes: parseInt(duration),
            numberOfQuestions: numberOfQuestions,
            pointsPerQuestion: parseInt(pointsPerProgram),
            totalScore: numberOfQuestions * parseInt(pointsPerProgram),
            questions: questions.map((q, index) => ({
                questionId: `q_${contestTitle.replace(/\s/g, '_').toLowerCase()}_${index + 1}_${Date.now()}`,
                questionNumber: index + 1,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
            })),
            
            // Meta data for the event
            status: 'queue', // Initial status is queue
            participants: [],
            submissions: [],
            organizer: 'Syntax',
            rules: 'Answer all questions correctly',
            bannerImageUrl: '',
            leaderboardEnabled: true,
            eventType: contestType, // "quiz" or "contest"
            eventMode: contestMode, // "strict" or "practice"
            topicsCovered: topicsCovered,
            allowedDepartments: allowedDepartments || 'Any department', // Added department field
            
            createdBy: req.user.userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const eventRef = await db.collection('events').add(eventData);

        res.status(201).json({
            message: 'Event created successfully!',
            eventId: eventRef.id,
            event: {
                id: eventRef.id,
                ...eventData
            }
        });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            message: 'Failed to create event. Please check server logs.',
            error: error.message
        });
    }
}

async function handleCodingContestCreation(req, res, data) {
    try {
        const { contestTitle, contestDescription, duration, numberOfQuestions, pointsPerProgram, questions, selectedLanguage, contestType, contestMode, topicsCovered, allowedDepartments } = data;

        // Validate coding contest questions structure
        if (Object.keys(questions).length !== numberOfQuestions) {
            return res.status(400).json({ 
                message: 'Number of questions provided does not match the configured count.' 
            });
        }

        console.log('Sample question data:', questions[1]);

        const problems = [];
        for (let i = 1; i <= numberOfQuestions; i++) {
            const questionData = questions[i];

            if (!questionData || !questionData.problem || !questionData.example || !Array.isArray(questionData.testCases) || questionData.testCases.length === 0) {
                return res.status(400).json({
                    message: `Problem ${i} is incomplete. Missing problem statement, example, or test cases.`
                });
            }

            if (!questionData.example.input || !questionData.example.output) {
                return res.status(400).json({ message: `Problem ${i} example is incomplete (missing input or output).` });
            }

            // Validate input/output formats
            if (!questionData.problemDetails || !questionData.problemDetails.inputFormat || !questionData.problemDetails.outputFormat) {
                return res.status(400).json({ message: `Problem ${i} is missing input or output format specifications.` });
            }

            // Validate starter code
            if (!questionData.starterCode || !questionData.starterCode.python || !questionData.starterCode.java) {
                return res.status(400).json({ message: `Problem ${i} is missing starter code for Python or Java.` });
            }

            for (let j = 0; j < questionData.testCases.length; j++) {
                const tc = questionData.testCases[j];
                if (!tc.input || !tc.output) {
                    return res.status(400).json({ message: `Problem ${i}, Test Case ${j + 1} is incomplete (missing input or output).` });
                }
            }

            const problemObject = {
                contestProblemCode: String.fromCharCode(64 + i), // A, B, C, ...
                points: parseInt(pointsPerProgram), 
                questionId: `cp_${contestTitle.replace(/\s/g, '_').toLowerCase()}_${i}_${Date.now()}`, 

                title: `Problem ${String.fromCharCode(64 + i)}: ${questionData.problem.split('\n')[0].substring(0, 50)}...`,
                description: questionData.problem,
                difficulty: "Undefined",
                topicsCovered: topicsCovered, 
                estimatedTimeMinutes: 20, 
                languagesSupported: selectedLanguage === 'both' ? ['python', 'java'] : [selectedLanguage],

                problemDetails: {
                    inputFormat: questionData.problemDetails.inputFormat,
                    outputFormat: questionData.problemDetails.outputFormat,
                    constraints: [], 
                    hint: "" 
                },
                starterCode: { 
                    python: questionData.starterCode.python,
                    java: questionData.starterCode.java,
                    javascript: "",
                    cpp: ""
                },

                examples: [
                    {
                        input: questionData.example.input,
                        output: questionData.example.output,
                        explanation: "" 
                    }
                ],

                testCases: questionData.testCases.map((tc, idx) => ({
                    testCaseId: `tc_${i}_${idx}`, 
                    input: tc.input,
                    expectedOutput: tc.output,
                    isHidden: true, 
                    description: `Test Case ${idx + 1} for Problem ${String.fromCharCode(64 + i)}`
                })),

                timeLimitMs: 1000,
                memoryLimitMb: 256
            };

            console.log(`Problem ${i} created:`, {
                inputFormat: problemObject.problemDetails.inputFormat,
                outputFormat: problemObject.problemDetails.outputFormat,
                pythonStarterCode: problemObject.starterCode.python.substring(0, 50) + '...',
                javaStarterCode: problemObject.starterCode.java.substring(0, 50) + '...'
            });

            problems.push(problemObject);
        }

        const eventData = {
            eventTitle: contestTitle,
            eventDescription: contestDescription,
            durationMinutes: parseInt(duration), 
            numberOfPrograms: numberOfQuestions,
            pointsPerProgram: parseInt(pointsPerProgram),
            problems: problems,
            
            // Meta data for the event
            status: 'queue', // Initial status is queue
            participants: [],
            submissions: [],
            organizer: 'Syntax',
            rules: 'Code on your own',
            bannerImageUrl: '',
            leaderboardEnabled: true,
            eventType: contestType, // "quiz" or "contest"
            eventMode: contestMode, // "strict" or "practice"
            topicsCovered: topicsCovered,
            allowedDepartments: allowedDepartments || 'Any department', // Added department field

            createdBy: req.user.userId, 
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const eventRef = await db.collection('events').add(eventData);

        res.status(201).json({
            message: 'Event created successfully!',
            eventId: eventRef.id,
            event: {
                id: eventRef.id,
                ...eventData 
            }
        });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            message: 'Failed to create event. Please check server logs.',
            error: error.message
        });
    }
}

// --- 9. Contest Management APIs ---

app.post('/api/admin/create-contest', requireAdminAuth, async (req, res) => {
    try {
        
        const {
            contestTitle,
            contestDescription,
            duration, 
            numberOfQuestions,
            pointsPerProgram,  
            questions,         
            selectedLanguage,
            contestType,
            contestMode,
            topicsCovered,
            allowedDepartments
        } = req.body;

        if (!contestTitle || !contestDescription || !duration || !numberOfQuestions || !pointsPerProgram || !contestType || !contestMode || !topicsCovered || !allowedDepartments) {
            return res.status(400).json({
                message: 'Missing required contest setup fields: title, description, duration, number of questions, points per program, contest type, contest mode, topics covered, or allowed departments.'
            });
        }

        // For coding contests, selectedLanguage is required
        if (contestType === 'contest' && !selectedLanguage) {
            return res.status(400).json({
                message: 'Selected language is required for coding contests.'
            });
        }

        const parsedNumberOfQuestions = parseInt(numberOfQuestions);
        if (isNaN(parsedNumberOfQuestions) || parsedNumberOfQuestions <= 0) {
            return res.status(400).json({ message: 'Number of questions must be a positive integer.' });
        }

        console.log('Received contest data:', {
            contestTitle,
            contestDescription,
            contestType,
            contestMode,
            topicsCovered,
            allowedDepartments,
            numberOfQuestions: parsedNumberOfQuestions,
            selectedLanguage
        });

        // Handle different contest types
        if (contestType === 'quiz') {
            // Handle Quiz Creation
            return await handleQuizCreation(req, res, {
                contestTitle,
                contestDescription,
                duration,
                numberOfQuestions: parsedNumberOfQuestions,
                pointsPerProgram,
                questions,
                contestType,
                contestMode,
                topicsCovered,
                allowedDepartments
            });
        } else if (contestType === 'contest') {
            // Handle Coding Contest Creation
            return await handleCodingContestCreation(req, res, {
                contestTitle,
                contestDescription,
                duration,
                numberOfQuestions: parsedNumberOfQuestions,
                pointsPerProgram,
                questions,
                selectedLanguage,
                contestType,
                contestMode,
                topicsCovered,
                allowedDepartments
            });
        } else {
            return res.status(400).json({
                message: 'Invalid contest type. Must be either "quiz" or "contest".'
            });
        }

    } catch (error) {
        console.error('Error in create-contest route:', error);
        res.status(500).json({
            message: 'Failed to create contest. Please check server logs.',
            error: error.message
        });
    }
});

app.get('/api/admin/events', requireAdminAuth, async (req, res) => {
    try {
        const eventsSnapshot = await db.collection('events')
            .where('createdBy', '==', req.user.userId)
            .get();

        const events = [];
        eventsSnapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort events by createdAt in descending order (newest first)
        events.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt?._seconds * 1000) || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt?._seconds * 1000) || new Date(0);
            return bTime - aTime;
        });

        res.status(200).json({
            message: 'Events retrieved successfully!',
            events
        });

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            message: 'Failed to fetch events. Please try again.',
            error: error.message
        });
    }
});

app.get('/api/admin/events/:eventId', requireAdminAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const eventDoc = await db.collection('events').doc(eventId).get();
        
        if (!eventDoc.exists) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // Check if the event belongs to the authenticated admin
        const eventData = eventDoc.data();
        if (eventData.createdBy !== req.user.userId) {
            return res.status(403).json({
                message: 'Access denied: You can only view events you created'
            });
        }

        res.status(200).json({
            message: 'Event retrieved successfully!',
            event: {
                id: eventDoc.id,
                ...eventData
            }
        });

    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            message: 'Failed to fetch event. Please try again.',
            error: error.message
        });
    }
});

app.put('/api/admin/events/:eventId', requireAdminAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.id;

        // Add updated timestamp
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // Check if the event belongs to the authenticated admin
        const eventData = eventDoc.data();
        if (eventData.createdBy !== req.user.userId) {
            return res.status(403).json({
                message: 'Access denied: You can only update events you created'
            });
        }

        await eventRef.update(updateData);

        res.status(200).json({
            message: 'Event updated successfully!',
            eventId
        });

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            message: 'Failed to update event. Please try again.',
            error: error.message
        });
    }
});

app.delete('/api/admin/events/:eventId', requireAdminAuth, async (req, res) => {
    try {
        const { eventId } = req.params;

        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // Check if the event belongs to the authenticated admin
        const eventData = eventDoc.data();
        if (eventData.createdBy !== req.user.userId) {
            return res.status(403).json({
                message: 'Access denied: You can only delete events you created'
            });
        }

        await eventRef.delete();

        res.status(200).json({
            message: 'Event deleted successfully!',
            eventId
        });

    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            message: 'Failed to delete event. Please try again.',
            error: error.message
        });
    }
});

// --- Article Upload Endpoint ---
app.post('/api/articles', requireAdminAuth, async (req, res) => {
    try {
        const { title, description, topicsCovered, allowedDepartments, articleContent, articleLink } = req.body;
        if (!title || !description || !topicsCovered || !allowedDepartments) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        if (!articleContent && !articleLink) {
            return res.status(400).json({ message: 'Either article content or article link must be provided.' });
        }
        if (articleContent && typeof articleContent !== 'string') {
            return res.status(400).json({ message: 'Article content must be a string.' });
        }
        if (articleLink && typeof articleLink !== 'string') {
            return res.status(400).json({ message: 'Article link must be a string.' });
        }
        const articleData = {
            title,
            description,
            topicsCovered,
            allowedDepartments,
            articleContent: articleContent || null,
            articleLink: articleLink || null,
            uploader: req.user.userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('articles').add(articleData);
        res.status(201).json({ message: 'Article created successfully!', articleId: docRef.id });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ message: 'Failed to create article.', error: error.message });
    }
});

// --- Article Fetch Endpoint ---
app.get('/api/articles', requireAdminAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('articles').orderBy('createdAt', 'desc').get();
        const articles = [];
        snapshot.forEach(doc => {
            articles.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json({ articles });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ message: 'Failed to fetch articles.', error: error.message });
    }
});

// --- Super Admin APIs ---

// Get all admins
app.get('/api/super-admin/admins', requireSuperAdminAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('isAdmin', '==', true).get();
        const admins = [];
        snapshot.forEach(doc => {
            const adminData = doc.data();
            admins.push({
                id: doc.id,
                userName: adminData.userName,
                email: adminData.email,
                isAdmin: adminData.isAdmin,
                isSuper: adminData.isSuper || false,
                createdAt: adminData.createdAt
            });
        });
        res.status(200).json({ admins });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ message: 'Failed to fetch admins.', error: error.message });
    }
});

// Add endpoint to create a new admin (super admin only)
app.post('/api/super-admin/admins', requireSuperAdminAuth, async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        if (!userName || !email || !password) {
            return res.status(400).json({ message: 'userName, email, and password are required.' });
        }
        // Check for duplicate email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        if (!snapshot.empty) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new admin
        const newAdmin = {
            userName,
            email,
            hashedPassword,
            isAdmin: true,
            isSuper: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await usersRef.add(newAdmin);
        res.status(201).json({ message: 'Admin created successfully!', id: docRef.id });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Failed to create admin.' });
    }
});

// Update admin details
app.put('/api/super-admin/admins/:adminId', requireSuperAdminAuth, async (req, res) => {
    try {
        const { adminId } = req.params;
        const { userName, email, newPassword } = req.body;

        const adminRef = db.collection('users').doc(adminId);
        const adminDoc = await adminRef.get();

        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        const adminData = adminDoc.data();
        if (!adminData.isAdmin) {
            return res.status(400).json({ message: 'User is not an admin.' });
        }

        const updateData = {};
        if (userName) updateData.userName = userName;
        if (email) updateData.email = email;
        if (newPassword) {
            updateData.hashedPassword = await hashPassword(newPassword);
        }

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await adminRef.update(updateData);

        res.status(200).json({ message: 'Admin updated successfully!' });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ message: 'Failed to update admin.', error: error.message });
    }
});

// Delete admin
app.delete('/api/super-admin/admins/:adminId', requireSuperAdminAuth, async (req, res) => {
    try {
        const { adminId } = req.params;

        const adminRef = db.collection('users').doc(adminId);
        const adminDoc = await adminRef.get();

        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        const adminData = adminDoc.data();
        if (!adminData.isAdmin) {
            return res.status(400).json({ message: 'User is not an admin.' });
        }

        if (adminData.isSuper) {
            return res.status(400).json({ message: 'Cannot delete a super admin.' });
        }

        await adminRef.delete();

        res.status(200).json({ message: 'Admin deleted successfully!' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: 'Failed to delete admin.', error: error.message });
    }
});

// Get all contests (for super admin to manage)
app.get('/api/super-admin/contests', requireSuperAdminAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('events').orderBy('createdAt', 'desc').get();
        const contests = [];
        snapshot.forEach(doc => {
            const contestData = doc.data();
            contests.push({
                id: doc.id,
                title: contestData.eventTitle,
                description: contestData.eventDescription,
                type: contestData.eventType,
                mode: contestData.eventMode,
                status: contestData.status,
                createdBy: contestData.createdBy,
                createdAt: contestData.createdAt,
                participants: contestData.participants?.length || 0
            });
        });
        res.status(200).json({ contests });
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ message: 'Failed to fetch contests.', error: error.message });
    }
});

// Delete contest (super admin can delete any contest)
app.delete('/api/super-admin/contests/:contestId', requireSuperAdminAuth, async (req, res) => {
    try {
        const { contestId } = req.params;

        const contestRef = db.collection('events').doc(contestId);
        const contestDoc = await contestRef.get();

        if (!contestDoc.exists) {
            return res.status(404).json({ message: 'Contest not found.' });
        }

        await contestRef.delete();

        res.status(200).json({ message: 'Contest deleted successfully!' });
    } catch (error) {
        console.error('Error deleting contest:', error);
        res.status(500).json({ message: 'Failed to delete contest.', error: error.message });
    }
});

// Add this endpoint for super admin profile
app.get('/api/super-admin/profile', requireSuperAdminAuth, async (req, res) => {
    try {
        // req.user is set by requireSuperAdminAuth middleware
        const { userName, email, isSuper } = req.user;
        res.status(200).json({
            profile: {
                userName,
                email,
                isSuper
            }
        });
    } catch (error) {
        console.error('Error fetching super admin profile:', error);
        res.status(500).json({ message: 'Failed to fetch super admin profile.' });
    }
});

// Add this endpoint for super admin password update
app.put('/api/super-admin/profile', requireSuperAdminAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required.' });
        }
        const userId = req.user.userId;
        // Fetch user from Firestore
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const userData = userDoc.data();
        // Check current password
        const isPasswordValid = await bcrypt.compare(currentPassword, userData.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }
        // Update password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await userDocRef.update({ hashedPassword: newHashedPassword });
        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        console.error('Error updating super admin password:', error);
        res.status(500).json({ message: 'Failed to update password.' });
    }
});

// --- 9. Start the Express Server ---
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
