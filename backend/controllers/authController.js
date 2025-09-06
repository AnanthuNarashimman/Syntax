const authService = require("../services/authService");


const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { id, email: userEmail, userName, isAdmin, token } = await authService.loginAdminUser(email, password);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 180, // 3 hours
      sameSite: "Lax",
      path: "/",
    });

    res.status(200).json({
      message: "Admin login successful!",
      user: { id: id, email: userEmail, userName: userName, isAdmin: isAdmin },
    });
  } catch (error) {
    console.error("Admin login failed:", error.message);
    res.status(401).json({ message: error.message || "Authentication failed." });
  }
};

const studentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const {
      id,
      email: userEmail,
      userName,
      isStudent,
      department,
      year,
      section,
      semester,
      batch,
      token,
    } = await authService.loginStudentUser(email, password);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 180, // 3 hours
      sameSite: "Lax",
      path: "/",
    });

    res.status(200).json({
      message: "Student login successful!",
      user: {
        id,
        email: userEmail,
        userName,
        isStudent,
        department,
        year,
        section,
        semester,
        batch,
      },
    });
  } catch (error) {
    console.error("Student login failed:", error.message);
    res.status(401).json({ message: error.message || "Authentication failed." });
  }
};

const superAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { id, email: userEmail, userName, isSuper, token } = await authService.loginSuperAdminUser(email, password);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour for Super Admin
      sameSite: "Lax",
      path: "/",
    });

    res.status(200).json({
      message: "Super Admin login successful!",
      user: { id: id, email: userEmail, userName: userName, isSuper: isSuper },
    });
  } catch (error) {
    console.error("Super Admin login failed:", error.message);
    res.status(401).json({ message: error.message || "Authentication failed." });
  }
};

const logout = (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully." });
};


module.exports = {
  adminLogin,
  studentLogin,
  superAdminLogin,
  logout,
};