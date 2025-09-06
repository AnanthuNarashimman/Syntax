const bcrypt = require("bcryptjs");

async function comparePasswords(plainPassword, hashedPassword) {
  if (
    !plainPassword ||
    typeof plainPassword !== "string" ||
    !hashedPassword ||
    typeof hashedPassword !== "string"
  ) {
    throw new Error(
      "Both plainPassword and hashedPassword must be non-empty strings for comparison."
    );
  }
  
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error);
    throw new Error("Failed to compare password due to a server error.");
  }
}

async function hashPasswords(password) {
    if (!password || typeof password !== "string") {
      throw new Error("Password must be a non-empty string.");
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      console.error("Error hashing password:", error);
      throw new Error("Failed to hash password due to a server error.");
    }
}

module.exports = {
    comparePasswords,
    hashPasswords
}