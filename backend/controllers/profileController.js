const { db, admin } = require("../config/firebase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passwordUtil = require('../utils/passwordUtil');
const cache = require('../utils/cache');


// Controllers for Profile related operations

// Admin profile fetching
// 1) Retrieves token from cookies.
// 2) Decodes the token and sends back username and mail back to the client.
// 3) In case of missing token or any other errors, corresponding logs and errors will be thrown.
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

// Student Profile fetching
// 1) Returns an error if user id is not in request body
// 2) Collection "users" is searched if there is a document with matching userID
// 3) If no document exists, corresponsing response will be sent back
// 4) If exists, details are fetched and profile details is sent back to client
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


// Super Admin Profile fetching
// 1) Retrieves decoded token details from the request body
// 2) Responds to the client with the retrieved details
// 3) In case of errors or exceptions, appropriate message will be logged
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


// Admin Profile Verification
// 1) Gets old password from request body
// 2) Gets the token from cookies and decodes it in order to get the user id
// 3) User id is used to get the hashed password of that user from firebase
// 4) The current password is hashed and checked with the existing password in database
// 5) If it matches, then 'passwordMatch' is set as true and sent back to the client, else false
// 6) In case of errors or exceptions according logs will be displayed
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

// Admin Password Updation (Happens after password verification process)
// 1) Gets the new password from the request body
// 2) Gets the token from cookies and decodes it to get the user id
// 3) The user id is used to get the document reference of the current user from firebase
// 4) The new password is hashed and updated as password in firebase
// 5) In case of errors or exceptions, appropriate errors or logs will be shown
const AdminPasswordUpdate = async (req, res) => {
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

// Student Usernme Updation
// 1) Gets the current user name from the request body
// 2) Basic user name validation is done
// 3) The 'users' collection of firebase is searched with the user name to make sure there is no duplicate user names
// 4) Updates user name accordingly
// 5) In case of errors the logs will be shown accordingly
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

// Student skill updation
// 1) Gets the languages and skills from the user body
// 2) Gets the user id from request and updates the skills accordingly
// 3) In case of errors or exceptions, logs will be printed accordingly
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

// Student side password updation(Verfication & validation)
// 1) Gets the current password and new password from the request body
// 2) Gets user id from request and finds the appropriate student account document from firebase
// 3) Validate the entered password against the old password
// 4) If the entered old password is correct, new password is updated and stored as new password
// 5) In case of errors or exceptions, log will be printed accordingly
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
        const hashedNewPassword = await passwordUtil.hashPasswords(newPassword);

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

// Get student specific submission details
// 1) Gets the user id from the request
// 2) Then the corresponding document containing the user submission details is fetched from the firebase collection 'userSubmissions'
// 3) Submission counts and details are retrieved from the document
// 4) The submission count and the total points is returned to the client
// 5) In case of errors and exceptions, appropriate logs will be printed
const getSubmissionDetails = async (req, res) => {
    try {
        const userId = req.user.userId; 

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

// Get student progress data
// 1) Gets the user ID from the request
// 2) Gets month wise submission data
// 3) Returns to the client
// 4) In case of errors or exceptions, appropriate logs are printed
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
            // OPTIMIZED: Use points directly from eventAttempts (no need to fetch eventResults)
            const userProgressData = userProgressDoc.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Process data and update monthly totals
            // Points are now stored directly in eventAttempts, no additional queries needed
            userProgressData.forEach(item => {
                if (item.completed_at && item.status === 'completed') {
                    // Convert Firebase timestamp to JavaScript Date
                    const completedDate = new Date(item.completed_at._seconds * 1000);
                    const itemYear = completedDate.getFullYear();

                    // Only include data from current year
                    if (itemYear === currentYear) {
                        const monthKey = `${itemYear}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;

                        if (monthlyData[monthKey]) {
                            monthlyData[monthKey].contestsParticipated += 1;
                            // Use points from attempt (stored during submission) or from score field
                            const points = item.points || item.score || 0;
                            monthlyData[monthKey].totalScore += points;
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


// Leader board Fetching (Optimized with Caching and Batch Queries)
// 1) Gets the user id from the authenticated request
// 2) Checks if leaderboard data is available in cache (30-second TTL) to reduce Firebase reads
// 3) If cached, returns the cached leaderboard data immediately
// 4) If not cached, fetches top 20 users from 'userSubmissions' collection ordered by totalScore (descending)
// 5) Identifies entries missing userName/department and collects their userIds for batch lookup
// 6) Performs batch queries (max 10 userIds per query using 'in' operator) to fetch missing user data from 'users' collection
// 7) Merges user data (userName, department) with submission data to build complete leaderboard
// 8) Stores the compiled leaderboard in cache for 30 seconds to optimize subsequent requests
// 9) Checks if the current user is in the top 20; if yes, uses their data from leaderboard
// 10) If current user is not in top 20, fetches their submission data and calculates position by counting users with higher scores
// 11) Returns leaderboard array (top 20) and userPosition object (current user's rank and stats)
// 12) In case of errors or exceptions, appropriate logs are printed and error response is sent
const getLeaderboard = async (req, res) => {
    try {
        const userId = req.user.userId; // Get userId from authenticated middleware

        // OPTIMIZED: Cache leaderboard data for 30 seconds to reduce reads
        const cacheKey = 'leaderboard:top20';
        const cachedLeaderboard = cache.get(cacheKey);

        let leaderboardData;

        if (cachedLeaderboard) {
            // Use cached data
            leaderboardData = cachedLeaderboard;
            console.log('Serving leaderboard from cache');
        } else {
            // Fetch fresh data
            console.log('Fetching fresh leaderboard data');

            // OPTIMIZED: Single query to get top 20 leaderboard entries
            const leaderboardDoc = await db.collection("userSubmissions")
                .orderBy("totalScore", "desc")
                .limit(20)
                .get();

            // OPTIMIZED: Collect unique userIds that need user data lookup
            const userIdsNeedingLookup = new Set();
            const submissionsMap = new Map();

            leaderboardDoc.docs.forEach((doc, index) => {
                const submissionData = doc.data();
                submissionsMap.set(doc.id, {
                    id: doc.id,
                    position: index + 1,
                    ...submissionData
                });

                // Only lookup if userName/department is missing from submission data
                if (!submissionData.userName || !submissionData.department) {
                    if (submissionData.userId) {
                        userIdsNeedingLookup.add(submissionData.userId);
                    }
                }
            });

            // OPTIMIZED: Batch fetch user data only if needed (use IN query for up to 10 at a time)
            const userDataMap = new Map();
            if (userIdsNeedingLookup.size > 0) {
                const userIdsArray = Array.from(userIdsNeedingLookup);

                // Firestore 'in' query supports max 10 items, so batch them
                for (let i = 0; i < userIdsArray.length; i += 10) {
                    const batch = userIdsArray.slice(i, i + 10);
                    const usersQuery = await db.collection("users")
                        .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                        .get();

                    usersQuery.docs.forEach(doc => {
                        const userData = doc.data();
                        userDataMap.set(doc.id, {
                            userName: userData.userName || 'Unknown',
                            department: userData.department || 'Unknown'
                        });
                    });
                }
            }

            // OPTIMIZED: Build leaderboard data using cached user data
            leaderboardData = Array.from(submissionsMap.values()).map(submission => {
                let userName = submission.userName || 'Unknown';
                let department = submission.department || 'Unknown';

                // Use cached user data if userName/department was missing
                if ((!submission.userName || !submission.department) && submission.userId) {
                    const cachedUserData = userDataMap.get(submission.userId);
                    if (cachedUserData) {
                        userName = cachedUserData.userName;
                        department = cachedUserData.department;
                    }
                }

                return {
                    ...submission,
                    userName,
                    department
                };
            });

            // Cache the leaderboard for 30 seconds
            cache.set(cacheKey, leaderboardData, 30);
        }

        let userPosition = null;

        if (userId) {
            // Check if user is already in top 20
            const userInTop20 = leaderboardData.find(user => user.userId === userId);

            if (userInTop20) {
                userPosition = { ...userInTop20 };
            } else {
                // User not in top 20, fetch their position
                const userQuery = await db.collection("userSubmissions")
                    .where("userId", "==", userId)
                    .get();

                if (!userQuery.empty) {
                    const userDoc = userQuery.docs[0];
                    const userData = userDoc.data();
                    const userScore = userData.totalScore || 0;

                    // Get userName and department from submission data or lookup
                    let currentUserName = userData.userName || 'Unknown';
                    let currentUserDepartment = userData.department || 'Unknown';

                    // Only fetch from users collection if data is missing
                    if (!userData.userName || !userData.department) {
                        // Fallback: single read for current user if not in cache
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
                    }

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
        console.error('Error in getLeaderboard:', error);
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
    AdminPasswordUpdate,
    getSubmissionDetails,
    getStudentProgressData,
    getLeaderboard
}