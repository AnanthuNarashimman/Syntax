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

const getSubmissionDetails = async (req, res) => {
    try {
        const userId = req.user.userId; // Fixed: removed destructuring

        if (userId) {
            console.log("UserId:", userId);
        } else {
            console.log("No userId found");
            return res.status(400).json({
                message: "User ID not found"
            });
        }

        const userSubmissionDoc = await db.collection("userSubmissions").where("userId", "==", userId).get();

        if (!userSubmissionDoc.empty) {
            const firstDoc = userSubmissionDoc.docs[0];
            const submissionData = firstDoc.data();

            const totalScore = submissionData.totalScore || 0;
            const count = submissionData.submissionCount || 0;

            console.log("TotalScores:", totalScore);
            console.log("Count:", count);

            res.status(200).json({
                "Points": totalScore,
                "Count": count
            });
        } else {
            console.log("No data found. Sending default data");
            res.status(200).json({
                "Points": 0,
                "Count": 0
            });
        }
    } catch (error) {
        console.error("Error fetching submission details:", error);
        res.status(500).json({
            message: "Failed to fetch submission details",
            error: error.message
        });
    }
}


const getStudentProgressData = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(userId);
        
        const userProgressDoc = await db.collection("eventAttempts").where("userId", "==", userId).get();
        
        // Get current year
        const currentYear = new Date().getFullYear();
        
        // Initialize data for all 12 months of current year
        const monthlyData = {};
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        // Initialize all months with zero values
        for (let i = 0; i < 12; i++) {
            const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = {
                month: monthNames[i],
                contestsParticipated: 0,
                totalScore: 0,
                monthNumber: i + 1
            };
        }

        if (!userProgressDoc.empty) {
            // Prepare initial data
            const userProgressData = userProgressDoc.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch all result documents in parallel
            const resultPromises = userProgressData.map(async (progressData) => {
                if (progressData.result_ref) {
                    try {
                        const resultDoc = await db.collection("eventResults").doc(progressData.result_ref).get();
                        if (resultDoc.exists) {
                            const resultData = resultDoc.data();
                            return {
                                ...progressData,
                                points: resultData.points || 0
                            };
                        }
                    } catch (error) {
                        console.error(`Error fetching result for doc ${progressData.id}:`, error);
                    }
                }
                return {
                    ...progressData,
                    points: 0
                };
            });

            const finalProgressData = await Promise.all(resultPromises);

            // Process actual data and update monthly totals
            finalProgressData.forEach(item => {
                if (item.completed_at && item.status === 'completed') {
                    // Convert Firebase timestamp to JavaScript Date
                    const completedDate = new Date(item.completed_at._seconds * 1000);
                    const itemYear = completedDate.getFullYear();
                    
                    // Only include data from current year
                    if (itemYear === currentYear) {
                        const monthKey = `${itemYear}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (monthlyData[monthKey]) {
                            monthlyData[monthKey].contestsParticipated += 1;
                            monthlyData[monthKey].totalScore += item.points || 0;
                        }
                    }
                }
            });
        }

        // Convert to array and sort by month number to ensure proper order
        const sortedMonthlyData = Object.values(monthlyData)
            .sort((a, b) => a.monthNumber - b.monthNumber)
            .map(({ monthNumber, ...rest }) => rest); // Remove monthNumber field

        console.log('Monthly Progress Data for', currentYear, ':', sortedMonthlyData);

        res.status(200).json({
            "Result": sortedMonthlyData,
            "year": currentYear
        });

    } catch (error) {
        console.error('Error in getStudentProgressData:', error);
        res.status(500).json({
            "error": "Internal server error"
        });
    }
}

const getLeaderboard = async (req, res) => {
    try {
        const userId = req.user.userId; // Get userId from authenticated middleware

        const leaderboardDoc = await db.collection("userSubmissions")
            .orderBy("totalScore", "desc")
            .limit(20)
            .get();

        // Fetch userNames for all users in leaderboard
        const leaderboardData = await Promise.all(
            leaderboardDoc.docs.map(async (doc, index) => {
                const submissionData = doc.data();
                let userName = 'Unknown';
                let department = 'Unknown';
                
                // Fetch userName and department from users collection
                if (submissionData.userId) {
                    try {
                        const userDoc = await db.collection("users").doc(submissionData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userName = userData.userName || 'Unknown';
                            department = userData.department || 'Unknown';
                        }
                    } catch (error) {
                        console.error(`Error fetching user data for ${submissionData.userId}:`, error);
                    }
                }

                return {
                    id: doc.id,
                    position: index + 1,
                    userName: userName,
                    department: department,
                    ...submissionData
                };
            })
        );

        let userPosition = null;

        if (userId) {
            // Search by userId field, not document ID
            const userQuery = await db.collection("userSubmissions")
                .where("userId", "==", userId)
                .get();
            
            if (!userQuery.empty) {
                const userDoc = userQuery.docs[0]; // Get the first (should be only) document
                const userData = userDoc.data();
                const userScore = userData.totalScore || 0;

                // Fetch userName for current user
                let currentUserName = 'Unknown';
                let currentUserDepartment = 'Unknown';
                try {
                    const currentUserDoc = await db.collection("users").doc(userId).get();
                    if (currentUserDoc.exists) {
                        const currentUserData = currentUserDoc.data();
                        currentUserName = currentUserData.userName || 'Unknown';
                        currentUserDepartment = currentUserData.department || 'Unknown';
                    }
                } catch (error) {
                    console.error(`Error fetching current user data:`, error);
                }

                // Check if user is already in top 20
                const userInTop20 = leaderboardData.find(user => user.userId === userId);
                
                if (userInTop20) {
                    userPosition = {
                        ...userInTop20
                    };
                } else {
                    // Count users with higher scores
                    const higherScoresQuery = await db.collection("userSubmissions")
                        .where("totalScore", ">", userScore)
                        .get();

                    const position = higherScoresQuery.size + 1;

                    userPosition = {
                        id: userDoc.id,
                        position: position,
                        totalScore: userScore,
                        userName: currentUserName,
                        department: currentUserDepartment,
                        ...userData
                    };
                }
            }
        }

        res.status(200).json({
            "leaderboard": leaderboardData,
            "userPosition": userPosition
        });

    } catch (error) {
        console.error('Error in getLeaderboardWithUserPosition:', error);
        res.status(500).json({
            "error": "Internal server error"
        });
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
    adminPasswordUpdate,
    getSubmissionDetails,
    getStudentProgressData,
    getLeaderboard
}