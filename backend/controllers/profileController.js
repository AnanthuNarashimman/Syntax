const { db, admin } = require("../config/firebase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passwordUtil = require('../utils/passwordUtil');


// Controllers for Profiles

// Profile Fetching
const adminProfile = async (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized: Please log in to view your profile." });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured on the server.");
        }
        const decoded = jwt.verify(token, jwtSecret);

        if (!decoded.isAdmin) {
            return res.status(403).json({
                message: "Access denied: Admins use a different profile view.",
            });
        }

        res.status(200).json({
            userName: decoded.userName,
            mail: decoded.email,
        });
    } catch (error) {
        console.error("Token verification failed for user profile:", error.message);
        return res
            .status(401)
            .json({ message: "Unauthorized: Invalid or expired token." });
    }
}


const studentProfile = async (req, res) => {
    try {
        if (!req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userRef = db.collection("users").doc(req.user.userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userSnap.data();
        const {
            userName,
            email,
            department,
            year,
            section,
            semester,
            batch,
            languages = [],
            skills = [],
        } = userData;

        res.status(200).json({
            profile: {
                userName,
                email,
                department,
                year,
                section,
                semester,
                batch,
                languages,
                skills,
            },
        });
    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ message: "Failed to fetch student profile." });
    }
}

const superProfile = async (req, res) => {
    try {
        const { userName, email, isSuper } = req.user;
        res.status(200).json({
            profile: {
                userName,
                email,
                isSuper,
            },
        });
    } catch (error) {
        console.error("Error fetching super admin profile:", error);
        res.status(500).json({ message: "Failed to fetch super admin profile." });
    }
}


// Admin Profile Updation
const adminPasswordVerify = async (req, res) => {
    try {
        const { currentPassword } = req.body;

        if (!currentPassword) {
            return res.status(400).json({ message: "Current password is required." });
        }

        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Please log in." });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("Server configuration error: JWT_SECRET not set.");
        }

        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        if (!userId) {
            return res
                .status(400)
                .json({ message: "Invalid token: User ID missing." });
        }

        const userDocRef = db.collection("users").doc(userId);
        const snapshot = await userDocRef.get();

        if (!snapshot.exists) {
            return res.status(404).json({ message: "User not found." });
        }

        const userData = snapshot.data();
        const hashedPassword = userData.hashedPassword;

        if (!hashedPassword) {
            console.error(`User ${userId} has no hashed password in DB.`);
            return res
                .status(500)
                .json({ message: "Server error: User password data is corrupted." });
        }

        console.log(currentPassword);

        const isPasswordValid = await passwordUtil.comparePasswords(
            currentPassword,
            hashedPassword
        );

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        res.status(200).json({
            PasswordMatch: true,
        });
    } catch (error) {
        console.error("Password Verification failed:", error.message);

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid or expired token." });
        }
        if (error.message.includes("JWT_SECRET not set")) {
            return res.status(500).json({ message: "Server configuration error." });
        }

        res.status(500).json({
            message: error.message || "An unexpected server error occurred.",
        });
    }
}


const adminPasswordUpdate = async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: "New Password is required." });
        }

        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Please log in." });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("Server Configuration error: JWT_SECRET not set.");
        }

        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        if (!userId) {
            return res
                .status(400)
                .json({ message: "Invalid token: User ID missing." });
        }

        const saltRounds = 10;

        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const userDocRef = db.collection("users").doc(userId);

        await userDocRef.update({
            hashedPassword: newHashedPassword,
        });

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error updating password in Firestore:", error);
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid or expired token." });
        }

        res.status(500).json({ message: "Failed to update password." });
    }
}

// Student Profile Updation
const studentNameUpdate = async (req, res) => {
    try {
        const { newUsername } = req.body;

        if (!req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!newUsername || newUsername.trim().length < 3) {
            return res
                .status(400)
                .json({ message: "Username must be at least 3 characters long" });
        }

        if (newUsername.length > 20) {
            return res
                .status(400)
                .json({ message: "Username must be less than 20 characters" });
        }

        // Check if username already exists
        const existingUser = await db
            .collection("users")
            .where("userName", "==", newUsername.trim())
            .limit(1)
            .get();

        if (!existingUser.empty) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const userRef = db.collection("users").doc(req.user.userId);

        await userRef.update({
            userName: newUsername.trim(),
        });

        return res.status(200).json({
            message: "Username updated successfully",
        });
    } catch (error) {
        console.error("Error updating username:", error);
        res.status(500).json({ message: "Failed to update username" });
    }
}

const studentSkillsUpdate = async (req, res) => {
    try {
        const { languages, skills } = req.body;

        if (!req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userRef = db.collection("users").doc(req.user.userId);

        await userRef.update({
            languages: languages || [],
            skills: skills || [],
        });

        const updatedSnap = await userRef.get();

        return res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedSnap.data(),
        });
    } catch (error) {
        console.error("Error updating skills:", error);
        res.status(500).json({ message: "Failed to update skills" });
    }
}

const studentProfileUpdate = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ message: "Current password and new password are required" });
        }

        // Get current user data
        const userRef = db.collection("users").doc(req.user.userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userSnap.data();

        // Verify current password
        const isCurrentPasswordValid = await passwordUtil.comparePasswords(
            currentPassword,
            userData.hashedPassword
        );
        if (!isCurrentPasswordValid) {
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res
                .status(400)
                .json({ message: "New password must be at least 6 characters long" });
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        await userRef.update({
            hashedPassword: hashedNewPassword,
        });

        return res.status(200).json({
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Failed to update password" });
    }
}

// Super AdminProfileUpdation
const superPasswordChange = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ message: "Current and new password are required." });
        }
        const userId = req.user.userId;
        // Fetch user from Firestore
        const userDocRef = db.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found." });
        }
        const userData = userDoc.data();
        // Check current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            userData.hashedPassword
        );
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ message: "Current password is incorrect." });
        }
        // Update password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await userDocRef.update({ hashedPassword: newHashedPassword });
        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error updating super admin password:", error);
        res.status(500).json({ message: "Failed to update password." });
    }
}

module.exports = {
    adminProfile,
    studentProfile,
    superPasswordChange,
    superProfile,
    studentNameUpdate, 
    studentProfileUpdate, 
    studentSkillsUpdate,
    adminPasswordVerify,
    adminPasswordUpdate
}