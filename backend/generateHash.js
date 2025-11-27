// generateHash.js
// !!! WARNING: This script is for generating hashes for initial setup ONLY.
// !!! DO NOT keep this script in your production application or expose it publicly.

const bcrypt = require('bcryptjs'); // Make sure bcryptjs is installed: npm install bcryptjs

async function generateHash(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
        console.error("Please provide a valid plain-text password.");
        return null;
    }

    try {
        const saltRounds = 10; // Same cost factor as in your app.js
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        console.log(`Plain Password: "${plainPassword}"`);
        console.log(`Hashed Password: "${hashedPassword}"`);
        return hashedPassword;
    } catch (error) {
        console.error("Error generating hash:", error);
        return null;
    }
}

// --- Usage Examples ---
// Replace 'YourAdminPassword123' and 'YourStudentPassword456' with your actual desired passwords.
// Run this script for each password you need to hash.
generateHash('SuperAdmin@123');
// generateHash('MyStudentPass#2'); // Uncomment to generate for a student password
