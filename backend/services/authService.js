const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
const { comparePasswords } = require("../utils/passwordUtil");


// Authentication Service Logic (JWT) for "Admins"
// 1) Takes email and password and checks their data types.
// 2) Looks for the collection "users" in firebase with matching email. If there is not a matching record, an error will be throwed.
// 3) Compares the password using the function "comparePasswords". If it isnt'a match, an error will be throwed.
// 4) Creates "payload" with necessary datas {userId, userName, email, isAdmin} which will encrypted as token.
// 5) Creates a token that expires in 3 hours.
// 6) If an error occurs, appropriate messages will be shown.
async function loginAdminUser(email, password) {
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    throw new Error("Email and password are required and must be strings.");
  }

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      throw new Error("Invalid credentials.");
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const isPasswordValid = await comparePasswords(
      password,
      userData.hashedPassword
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    if (userData.isAdmin !== true) {
      throw new Error(
        "Access denied: User is not an authorized administrator."
      );
    }

    const payload = {
      userId: userId,
      userName: userData.userName,
      email: userData.email,
      isAdmin: userData.isAdmin,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured in environment variables.");
    }

    const tokenOptions = {
      expiresIn: "3h",
    };

    const token = jwt.sign(payload, jwtSecret, tokenOptions);

    return {
      id: userId,
      email: userData.email,
      userName: userData.userName,
      isAdmin: userData.isAdmin,
      token: token,
      message: "Admin login successful!",
    };
  } catch (error) {
    console.error("Admin login attempt failed:", error.message);
    if (
      error.message.includes("Invalid credentials") ||
      error.message.includes("Access denied") ||
      error.message.includes("User is not an authorized administrator")
    ) {
      throw error;
    }
    throw new Error(
      "An unexpected server error occurred during login. Please try again."
    );
  }
}

// Authentication Service Logic (JWT) for "Students"
// 1) Takes email and password and checks their data types.
// 2) Looks for the collection "users" in firebase with matching email. If there is not a matching record, an error will be throwed.
// 3) Compares the password using the function "comparePasswords". If it isnt'a match, an error will be throwed.
// 4) Creates "payload" with necessary datas {userId, userName, email, isStudent} which will encrypted as token.
// 5) Creates a token that expires in 3 hours.
// 6) If an error occurs, appropriate messages will be shown.
async function loginStudentUser(email, password) {
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    throw new Error("Email and password are required and must be strings.");
  }

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      throw new Error("Invalid credentials.");
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const isPasswordValid = await comparePasswords(
      password,
      userData.hashedPassword
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    if (userData.isStudent !== true) {
      throw new Error("Access denied: User is not a registered student.");
    }

    // Check if student is banned
    if (userData.status === "banned") {
      throw new Error("Account is banned. Please contact administrator.");
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
      batch: userData.batch,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured in environment variables.");
    }

    const tokenOptions = {
      expiresIn: "3h",
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
      message: "Student login successful!",
    };
  } catch (error) {
    console.error("Student login attempt failed:", error.message);
    if (
      error.message.includes("Invalid credentials") ||
      error.message.includes("Access denied") ||
      error.message.includes("User is not a registered student") ||
      error.message.includes("Account is banned")
    ) {
      throw error;
    }
    throw new Error(
      "An unexpected server error occurred during login. Please try again."
    );
  }
}

// Authentication Service Logic (JWT) for "Super Admins".
// 1) Takes email and password and checks their data types.
// 2) Looks for the collection "users" in firebase with matching email. If there is not a matching record, an error will be throwed.
// 3) Compares the password using the function "comparePasswords". If it isnt'a match, an error will be throwed.
// 4) Creates "payload" with necessary datas {userId, userName, email, isAdmin} which will encrypted as token.
// 5) Creates a token that expires in 3 hours.
// 6) If an error occurs, appropriate messages will be shown.
async function loginSuperAdminUser(email, password) {
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    throw new Error("Email and password are required and must be strings.");
  }

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      throw new Error("Invalid credentials.");
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const isPasswordValid = await comparePasswords(
      password,
      userData.hashedPassword
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    if (userData.isSuper !== true) {
      throw new Error("Access denied: User is not a super administrator.");
    }

    const payload = {
      userId: userId,
      userName: userData.username,
      email: userData.email,
      isSuper: userData.isSuper,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured in environment variables.");
    }

    const tokenOptions = {
      expiresIn: "1h",
    };

    const token = jwt.sign(payload, jwtSecret, tokenOptions);

    return {
      id: userId,
      email: userData.email,
      userName: userData.userName,
      isSuper: userData.isSuper,
      token: token,
      message: "Super Admin login successful!",
    };
  } catch (error) {
    console.error("Super Admin login attempt failed:", error.message);
    if (
      error.message.includes("Invalid credentials") ||
      error.message.includes("Access denied") ||
      error.message.includes("User is not a super administrator")
    ) {
      throw error;
    }
    throw new Error(
      "An unexpected server error occurred during login. Please try again."
    );
  }
}

module.exports = {
  loginAdminUser,
  loginStudentUser,
  loginSuperAdminUser,
};