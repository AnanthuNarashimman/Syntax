// Having a lot of comments doesn't mean it is made using AI. 
// We really spent time to write meaningful comments, trying to explain what each block or function does.

// The server is "Stateless" meaning there won't be any information stored on server about users.
// Make sure to take a glance on how "JWT" authentication works before diving deep.
// For now, in JWT the server sends back a encryoted token after authentication called as "JSON Web Tokens" which will be stored in browser.
// Everytime browser makes a request, the server reads the token and finds out which user is making that request.

// Core Node.js and Express Imports 
const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');

const security_key = process.env.SECURITY_KEY

// Firebase Admin SDK Initialization 
const admin = require('firebase-admin');
const serviceAccount = require(security_key);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Password Hashing Utilities


// Hashes the plain string password 
// Used by "Super Admin" to hash passwords while adding new Admins
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

// Compares the entered plain password by hashing and comparing it with the existing hashedPassword
// Used for Admin logins, Super Admin logins and for password changing functionalities where there is a need to verify an existing password
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

// Authentication Service Logic


// Authentication Service Logic (JWT) for "Admins"
// 1) Takes email and password and checks their data types.
// 2) Looks for the collection "users" in firebase with matching email. If there is not a matching record, an error will be throwed.
// 3) Compares the password using the function "comparePasswords (Line:52)". If it isnt'a match, an error will be throwed.
// 4) Creates "payload" with necessary datas {userId, userName, email, isAdmin} which will encrypted as token.
// 5) Creates a token that expires in 3 hours.
// 6) If an error occurs, appropriate messages will be shown.
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
            expiresIn: '3h'
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


// Authentication Service Logic (JWT) for "Students"
// 1) Takes email and password and checks their data types.
// 2) Looks for the collection "users" in firebase with matching email. If there is not a matching record, an error will be throwed.
// 3) Compares the password using the function "comparePasswords (Line:52)". If it isnt'a match, an error will be throwed.
// 4) Creates "payload" with necessary datas {userId, userName, email, isStudent} which will encrypted as token.
// 5) Creates a token that expires in 3 hours.
// 6) If an error occurs, appropriate messages will be shown.
async function loginStudentUser(email, password) {
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

        if (userData.isStudent !== true) {
            throw new Error('Access denied: User is not a registered student.');
        }

        // Check if student is banned
        if (userData.status === 'banned') {
            throw new Error('Account is banned. Please contact administrator.');
        }

        const payload = {
            userId: userId,
            userName: userData.userName,
            email: userData.email,
            isStudent: userData.isStudent,
            department: userData.department,
            year: userData.year,
            section: userData.section,
            semester: userData.semester,
            batch: userData.batch
        };

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured in environment variables.');
        }

        const tokenOptions = {
            expiresIn: '3h'
        };

        const token = jwt.sign(payload, jwtSecret, tokenOptions);

        return {
            id: userId,
            email: userData.email,
            userName: userData.userName,
            isStudent: userData.isStudent,
            department: userData.department,
            year: userData.year,
            section: userData.section,
            semester: userData.semester,
            batch: userData.batch,
            token: token,
            message: 'Student login successful!'
        };

    } catch (error) {
        console.error('Student login attempt failed:', error.message);
        if (error.message.includes('Invalid credentials') || error.message.includes('Access denied') || error.message.includes('User is not a registered student') || error.message.includes('Account is banned')) {
            throw error;
        }
        throw new Error('An unexpected server error occurred during login. Please try again.');
    }
}

// Authentication Service Logic (JWT) for "Super Admins".
// 1) Takes email and password and checks their data types.
// 2) Looks for the collection "users" in firebase with matching email. If there is not a matching record, an error will be throwed.
// 3) Compares the password using the function "comparePasswords (Line:52)". If it isnt'a match, an error will be throwed.
// 4) Creates "payload" with necessary datas {userId, userName, email, isAdmin} which will encrypted as token.
// 5) Creates a token that expires in 3 hours.
// 6) If an error occurs, appropriate messages will be shown.
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

// Express App Setup and Middleware Configuration 
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Middleware for Admin-Only Route Protection 
// Used by functionalities like "manage quizzes, create contest, event management, article management" to ensure the request is made by an admin.
// 1) Gets the encrypted 'auth-token' from the browser cookies and decodes it.
// 2) Checks for "isAdmin" in the token. It is a boolean value from our firebase db. 
// 3) If the requested user is actually an admin, then the function "next()" will be executed. 
//    next() : This is a handler that lets express knows that the current middleware is executed and returned success.
// 4) If the user is not admin, if any data is missing or if the server collapses, then corresponding errors will be logged
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


// Middleware for Student-Only Route Protection 
// Used by functionalities like "participating in contests, viewing student dashboard" to ensure the request is made by a student.
// 1) Gets the encrypted 'auth-token' from the browser cookies and decodes it.
// 2) Checks for "isStudent" in the token. It is a boolean value from our firebase db. 
// 3) If the requested user is actually a student, then the function "next()" will be executed. 
//    next() : This is a handler that lets express knows that the current middleware is executed and returned success.
// 4) If the user is not a student, if any data is missing or if the server collapses, then corresponding errors will be logged
function requireStudentAuth(req, res, next) {
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

        if (!req.user.isStudent) {
            return res.status(403).json({ message: 'Forbidden: Student access required.' });
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

// Middleware for SuperAdmin-Only Route Protection 
// Used by functionalities like "creating admins, managing contests, super-admin profile" to ensure the request is made by a super admin.
// 1) Gets the encrypted 'auth-token' from the browser cookies and decodes it.
// 2) Checks for "isSuper" in the token. It is a boolean value from our firebase db. 
// 3) If the requested user is actually an admin, then the function "next()" will be executed. 
//    next() : This is a handler that lets express knows that the current middleware is executed and returned success.
// 4) If the user is not super admin, if any data is missing or if the server collapses, then corresponding errors will be logged
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

// API Routes Definition


// API for Admin authentication

// Gets email and password from the frontend "AdminLogPage.jsx"
// Passes the email and password to the function "loginAdminUser (line : 75)" to check credentials
// Gets the encrypted token from the function "loginAdminUser" and stores it in cookies with the name "auth_token" with some security measures
// httpOnly: true => This prevents the cookie to be accessed from client-side javaScript
// secure: process.env.NODE_ENV === 'production' => Decides whether the cookie be passed only in HTTPS connection if the "NODE_ENV" is set as 'production' in env.
// maxAge: 1000 * 60 * 180 => The lifetime of the cookie. Set as 3 hours
// sameSite: 'Lax' => Ensures the cookie is not sent accross other sites. Keeps the cookie only accessible from the native website.
// path: '/' => Specifies the URL path for which the cookie is valid. '/' means it is valid for any URL.
app.post('/api/auth/admin-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { id, email: userEmail, isAdmin, token } = await loginAdminUser(email, password);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 180,
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



// API for Student authentication

// Gets email and password from the frontend "StudentLogPage.jsx"
// Passes the email and password to the function "loginStudentUser" to check credentials
// Gets the encrypted token from the function "loginStudentUser" and stores it in cookies with the name "auth_token" with some security measures
// httpOnly: true => This prevents the cookie to be accessed from client-side javaScript
// secure: process.env.NODE_ENV === 'production' => Decides whether the cookie be passed only in HTTPS connection if the "NODE_ENV" is set as 'production' in env.
// maxAge: 1000 * 60 * 180 => The lifetime of the cookie. Set as 3 hours
// sameSite: 'Lax' => Ensures the cookie is not sent accross other sites. Keeps the cookie only accessible from the native website.
// path: '/' => Specifies the URL path for which the cookie is valid. '/' means it is valid for any URL.
app.post('/api/auth/student-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { id, email: userEmail, userName, isStudent, department, year, section, semester, batch, token } = await loginStudentUser(email, password);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 180,
            sameSite: 'Lax',
            path: '/'
        });

        res.status(200).json({
            message: 'Student login successful!',
            user: { 
                id: id, 
                email: userEmail, 
                userName: userName,
                isStudent: isStudent,
                department: department,
                year: year,
                section: section,
                semester: semester,
                batch: batch
            }
        });

    } catch (error) {
        console.error('Student login failed:', error.message);
        res.status(401).json({ message: error.message || 'Authentication failed. Please check your credentials.' });
    }
});

// API for Super Admin authentication

// Gets email and password from the frontend "SuperAdminLogPage.jsx"
// Passes the email and password to the function "loginSuperAdminUser (line : 146)" to check credentials
// Gets the encrypted token from the function "loginAdminUser" and stores it in cookies with the name "auth_token" with some security measures
// httpOnly: true => This prevents the cookie to be accessed from client-side javaScript
// secure: process.env.NODE_ENV === 'production' => Decides whether the cookie be passed only in HTTPS connection if the "NODE_ENV" is set as 'production' in env.
// maxAge: 1000 * 60 * 180 => The lifetime of the cookie. Set as 3 hours
// sameSite: 'Lax' => Ensures the cookie is not sent accross other sites. Keeps the cookie only accessible from the native website.
// path: '/' => Specifies the URL path for which the cookie is valid. '/' means it is valid for any URL.
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


// API for Logging out

// Clears the "auth_token" from the cookie and conveys it to the frontend
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully.' });
});



// API for fetching and passing profile of Admins

// 1) Gets a bodyless reques from "AdminProfilePage.jsx"
// 2) Checks the "auth_token" from cookies and decodes it.
// 3) If there is a toke and the "isAdmin" is true in token, then the userName and email is decrypted from the token itself and sent back to the profile page
// 4) If either there is not a token or the user is not an admin, the profile won't be passed and corresponding errors will be logged
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

// API for fetching and passing profile of Students

// 1) Gets a bodyless request from "StudentProfilePage.jsx"
// 2) Checks the "auth_token" from cookies and decodes it.
// 3) If there is a token and the "isStudent" is true in token, then the student details are decrypted from the token itself and sent back to the profile page
// 4) If either there is not a token or the user is not a student, the profile won't be passed and corresponding errors will be logged
app.get('/api/student/profile', requireStudentAuth, (req, res) => {
    try {
        // req.user is set by requireStudentAuth middleware
        const { userName, email, department, year, section, semester, batch } = req.user;
        res.status(200).json({
            profile: {
                userName,
                email,
                department,
                year,
                section,
                semester,
                batch
            }
        });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Failed to fetch student profile.' });
    }
});



// API for verifying password

// Used by AdminProfilePage.jsx to verify the old password before updating passwords.
// 1) Gets the currentPassword from the ProfilePage and the token.
// 2) Decodes the userId from the auth_token and uses it find document of current user in firebase.
// 3) Compares the Password from the request and the actual password using the function  "ComparePasswords (Line:52)".
// 4) If the password is correct, then returns "PasswordMatch": true.
// 5) In case of any errors, appropriate errors will be logged.
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



// API for Updating password

// 1) Gets the new Password from the "AdminProfilePage.jsx" and auth_token from cookies.
// 2) Decodes the userId from the token to get the user document from firebase.
// 3) Hashes the new password. 
// 4) Updates the "hashedPassword" field in firebase db with new password.
// 5) In case of errors logs appropriate messages.
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

// Function for creating quizzes

// 1) Gets necessary informations from the route '/api/admin/create-contest'.
// 2) Checks if the number of questions macthes the value in "numberOfQuestions".
// 3) Checks if each question has four options and correct answer.
// 4) Logs an acknowledgement message of what quiz it is going to create.
// 5) An "eventData" dictionary is created with appropriate values. 
// 6) The "eventData" is added to the collection "events".
// 7) The id of the created event it's entire data is passed back.
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
            allowedDepartments: allowedDepartments || 'Any department',
            
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



// Function for creating coding contests

// 1) Gets necessary informations from the route '/api/admin/create-contest'.
// 2) Checks if the number of questions macthes the value in "numberOfQuestions".
// 3) Creates an empty array "problems".
// 4) Destructures the "questions" from the frontend as "questionData" and checks each question has necessary details such as input and output formats, test cases and more
// 5) After verifying each question it constructs a dictionary "problemData" from the question.
// 6) Pushes the "problemData" to the array "problems".
// 7) This prcoess is done for each question.
// 8) A dictionary "eventData" is created with necessary information including the "problems" array.
// 9) The eventData is added to the firebase db in collection named "events".
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

// Event Creation API

// 1) Gets required event type and questions from "CreateContests.jsx"
// 2) Checks for necessary information such as title, description and more.
// 3) Logs what data it recieved.
// 4) If the event is of type "quiz" then function "handleQuizCreation (line : 574)" will be executed.
// 5) If the event is of type "contest" then function "handleCodingContestCreation (line : 677)" will be executed.
// 6) If any error occurs, corresponding errors will be logged.
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



// Event fetching API

// 1) Gets a bodyless request from "ManageContests.jsx".
// 2) The middleware "requireAdminAuth (line : 227)" is executed to make sure the request is made by an admin.
// 3) Gets all events from collection "events" from firebase.
// 4) Sorts the Events in descending order of created time.
// 5) Sends back the events.
// 6) IF any error occurs, appropriate messages will be logged.
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


// Specific Event fetching API

// 1) Gets the "eventId" from Frontend.
// 2) Finds the event from the "events" collection using the "eventId".
// 3) Sends back the event information.
// 4) In case of any errors, Appropriate messages will be logged.
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



// Event Updation API

// 1) Gets the eventId and the datas to be updated from the frontend. Mostly called from the modal before starting an event.
// 2) Removes the data that needs not to be updated like the creator, id and time.
// 3) Checks if the event is created by the current user.
// 4) Updates the event document in the "events" collection.
// 5) If any errors, corresponsing messages will be logged.
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



// Article Upload API

// 1) Executes function "requireAdminAuth (line : 227)" to check if the requested user is admin. 
// 2) Gets the necessary details of article from Frontend.
// 3) Checks if necessary fields is present.
// 4) Creates "articleData" to have either a link or text file depending on the data passed from frontend.
// 5) Adds the data to the firebase collection "articles".
// 6) Sends back success message.
// 7) If any errors, appropriate messages will be logged.
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



// Article Fetch API

// 1) Executes function "requireAdminAuth (line : 227)" to check if the requested user is admin. 
// 2) Gets data from collection "articles".
// 3) Returns the articles back to frontend.
// 4) If any errors, appropriate messages will be logged.
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

// Super Admin API for fetching Admins

// 1) Gets a bodyless request from frontend.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Gets all admins from collection "users" using "isAdmin:true".
// 4) Returns admin details back to frontend.
// 5) If any errors, messages will be logged appropriately.
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

// Super Admin API for adding Admins.

// 1) Gets a request from frontend with admin name, email and password.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Checks if there is already an admin with same mail.
// 4) Hashes the password.
// 5) Adds the data to the "users" collection.
// 6) If any errors, messages will be logged.
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

// Super Admin API for Admin updation

// 1) Gets a request from frontend with data to be changed.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Checks if there is already an admin with same mail.
// 4) Updates the data.
// 6) If any errors, messages will be logged.
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



// Super Admin API for deleting Admins

// 1) Gets a request from frontend with adminId to be deleted.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Checks if there is already an admin with same mail.
// 4) If the data requested to be deleted is a super admin by defalt, an error will be raised.
// 5) Admin data is deleted from "users" collection
// 6) If any errors, messages will be logged.
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



// Super Admin API for displaying contests.

// 1) Gets a bodyless request from frontend.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Gets data from collection "events".
// 4) Sends back the data.
// 5) If any errors, messages will be logged.
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



// Super Admin API for deleting Contests.

// 1) Gets a request from frontend with contestId to be deleted.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Checks if there is already a contest with same contestId.
// 4) Deletes the contests from collection "events".
// 5) If any errors, messages will be logged.
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

// Super Admin API for profile

// 1) Gets a bodyless reqyest from frontend.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Gets back the decoded data and sends it to the frontend.
// 4) If any error, message will be logged appropriately.
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

// Super Admin API for super admin password update.

// 1) Get's user given current password and new password from the frontend.
// 2) The function "requireSuperAdminAuth" is executed to check if the requested user is "SuperAdmin".
// 3) Checks the user entered old password.
// 4) Hashed the new password and sets is as new password in firebase collection "users".
// 5) If any error, messages will be logged.
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

// Admin API for adding Students

// 1) Gets a request from frontend with student details (name, email, department, year, section, semester, batch).
// 2) The function "requireAdminAuth" is executed to check if the requested user is "Admin".
// 3) Checks if there is already a user with same email.
// 4) Generates a custom password in format "Name@YearBatch" and hashes it.
// 5) Creates a new student record in the "users" collection with isStudent = true and hashedPassword.
// 6) If any errors, messages will be logged.
app.post('/api/admin/students', requireAdminAuth, async (req, res) => {
    try {
        const { name, email, department, year, section, semester, batch } = req.body;
        
        if (!name || !email || !department || !year || !section || !semester || !batch) {
            return res.status(400).json({ message: 'All fields (name, email, department, year, section, semester, batch) are required.' });
        }

        // Check for duplicate email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        if (!snapshot.empty) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        // Generate custom password in format "Name@YearBatch"
        const customPassword = `${name.replace(/\s/g, '')}@${year}${section}`;
        console.log(customPassword);
        
        // Hash the custom password
        const hashedPassword = await hashPassword(customPassword);

        // Create new student
        const newStudent = {
            userName: name,
            email,
            department,
            year: parseInt(year),
            section,
            semester: parseInt(semester),
            batch,
            hashedPassword: hashedPassword, // Store the hashed password
            isStudent: true,
            isAdmin: false,
            isSuper: false,
            status: 'active',
            contestsParticipated: 0,
            totalScore: 0,
            joinDate: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await usersRef.add(newStudent);
        res.status(201).json({ 
            message: 'Student added successfully!', 
            id: docRef.id,
            student: {
                id: docRef.id,
                ...newStudent,
                joinDate: new Date().toISOString()
            },
            generatedPassword: customPassword // Return the generated password for admin reference
        });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ message: 'Failed to add student.', error: error.message });
    }
});

// Admin API for fetching Students

// 1) Gets a bodyless request from frontend.
// 2) The function "requireAdminAuth" is executed to check if the requested user is "Admin".
// 3) Gets all students from collection "users" using "isStudent:true".
// 4) Returns student details back to frontend.
// 5) If any errors, messages will be logged appropriately.
app.get('/api/admin/students', requireAdminAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('isStudent', '==', true).get();
        const students = [];
        snapshot.forEach(doc => {
            const studentData = doc.data();
            students.push({
                id: doc.id,
                name: studentData.userName,
                email: studentData.email,
                department: studentData.department,
                year: studentData.year,
                section: studentData.section,
                semester: studentData.semester,
                batch: studentData.batch,
                status: studentData.status || 'active',
                contestsParticipated: studentData.contestsParticipated || 0,
                totalScore: studentData.totalScore || 0,
                joinDate: studentData.joinDate ? studentData.joinDate.toDate().toISOString() : new Date().toISOString(),
                lastActive: studentData.lastActive || 'Recently',
                achievements: studentData.achievements || []
            });
        });
        res.status(200).json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students.', error: error.message });
    }
});

// Admin API for deleting a Student

// 1) Gets a request with student ID from frontend.
// 2) The function "requireAdminAuth" is executed to check if the requested user is "Admin".
// 3) Deletes the student document from the "users" collection.
// 4) Returns success message back to frontend.
// 5) If any errors, messages will be logged appropriately.
app.delete('/api/admin/students/:studentId', requireAdminAuth, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const studentRef = db.collection('users').doc(studentId);
        const studentDoc = await studentRef.get();
        
        if (!studentDoc.exists) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        
        const studentData = studentDoc.data();
        if (!studentData.isStudent) {
            return res.status(400).json({ message: 'This user is not a student.' });
        }
        
        await studentRef.delete();
        res.status(200).json({ message: 'Student deleted successfully.' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Failed to delete student.', error: error.message });
    }
});

// Admin API for banning a Student

// 1) Gets a request with student ID and ban reason from frontend.
// 2) The function "requireAdminAuth" is executed to check if the requested user is "Admin".
// 3) Updates the student status to "banned" and stores the ban reason.
// 4) Returns success message back to frontend.
// 5) If any errors, messages will be logged appropriately.
app.put('/api/admin/students/:studentId/ban', requireAdminAuth, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { reason } = req.body;
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Ban reason is required.' });
        }
        
        const studentRef = db.collection('users').doc(studentId);
        const studentDoc = await studentRef.get();
        
        if (!studentDoc.exists) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        
        const studentData = studentDoc.data();
        if (!studentData.isStudent) {
            return res.status(400).json({ message: 'This user is not a student.' });
        }
        
        await studentRef.update({
            status: 'banned',
            banReason: reason,
            bannedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.status(200).json({ message: 'Student banned successfully.' });
    } catch (error) {
        console.error('Error banning student:', error);
        res.status(500).json({ message: 'Failed to ban student.', error: error.message });
    }
});

// Admin API for bulk importing Students

// 1) Gets a request with Excel file from frontend.
// 2) The function "requireAdminAuth" is executed to check if the requested user is "Admin".
// 3) Parses the Excel file and adds multiple students to the "users" collection.
// 4) Returns success message with count of imported students back to frontend.
// 5) If any errors, messages will be logged appropriately.
app.post('/api/admin/students/bulk-import', requireAdminAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Parse the Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty or has no data.' });
        }

        // Validate required columns
        const requiredColumns = ['Name', 'Email', 'Department', 'Year', 'Section', 'Semester', 'Batch'];
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
            return res.status(400).json({ 
                message: `Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel file has all required columns.` 
            });
        }

        const usersRef = db.collection('users');
        const importedStudents = [];
        const errors = [];

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

            try {
                // Validate required fields
                if (!row.Name || !row.Email || !row.Department || !row.Year || !row.Section || !row.Semester || !row.Batch) {
                    errors.push(`Row ${rowNumber}: Missing required fields`);
                    continue;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.Email)) {
                    errors.push(`Row ${rowNumber}: Invalid email format`);
                    continue;
                }

                // Check if email already exists
                const existingUser = await usersRef.where('email', '==', row.Email).limit(1).get();
                if (!existingUser.empty) {
                    errors.push(`Row ${rowNumber}: Email ${row.Email} already exists`);
                    continue;
                }

                // Generate custom password in format "Name@YearBatch"
                const customPassword = `${row.Name.trim()}@${row.Year.toString().trim()}${row.Batch.trim()}`;
                
                // Hash the custom password
                const hashedPassword = await hashPassword(customPassword);

                // Create student document
                const studentData = {
                    userName: row.Name.trim(),
                    email: row.Email.trim().toLowerCase(),
                    department: row.Department.trim(),
                    year: parseInt(row.Year.toString().trim()),
                    section: row.Section.trim(),
                    semester: parseInt(row.Semester.toString().trim()),
                    batch: row.Batch.trim(),
                    hashedPassword: hashedPassword, // Store the hashed password
                    isStudent: true,
                    isAdmin: false,
                    isSuper: false,
                    status: 'active',
                    contestsParticipated: 0,
                    totalScore: 0,
                    lastActive: 'Never',
                    joinDate: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                const docRef = await usersRef.add(studentData);
                importedStudents.push({
                    id: docRef.id,
                    ...studentData
                });

            } catch (error) {
                errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        }

        const response = {
            message: `Bulk import completed. ${importedStudents.length} students imported successfully.`,
            importedCount: importedStudents.length,
            totalRows: data.length,
            errors: errors
        };

        if (errors.length > 0) {
            response.message += ` ${errors.length} rows had errors.`;
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Error bulk importing students:', error);
        res.status(500).json({ message: 'Failed to import students.', error: error.message });
    }
});

// Starting up Express Server
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
