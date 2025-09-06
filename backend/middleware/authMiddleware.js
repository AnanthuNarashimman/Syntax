const jwt = require("jsonwebtoken");

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
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided." });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured on the server.");
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required." });
    }

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
    return res
      .status(500)
      .json({ message: "Internal server error during authentication." });
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
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided." });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured on the server.");
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    if (!req.user.isStudent) {
      return res
        .status(403)
        .json({ message: "Forbidden: Student access required." });
    }

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
    return res
      .status(500)
      .json({ message: "Internal server error during authentication." });
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
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided." });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured on the server.");
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    if (!req.user.isSuper) {
      return res
        .status(403)
        .json({ message: "Forbidden: Super Admin access required." });
    }

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
    return res
      .status(500)
      .json({ message: "Internal server error during authentication." });
  }
}

module.exports = {
  requireAdminAuth,
  requireStudentAuth,
  requireSuperAdminAuth,
};