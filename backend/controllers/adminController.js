const { db, admin } = require("../config/firebase");
const bcrypt = require("bcrypt");
const passwordUtils = require("../utils/passwordUtil");


// Creates an admin account
// 1) Gets username , mail and password from the request body
// 2) Checks if already an admin exists with same email id
// 3) Hashes the password and the data is stored in 'users' collection
// 4) In case of errors or exceptions, appropriate logs are made
const createAdmin = async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        if (!userName || !email || !password) {
            return res
                .status(400)
                .json({ message: "userName, email, and password are required." });
        }
        // Check for duplicate email
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("email", "==", email).limit(1).get();
        if (!snapshot.empty) {
            return res
                .status(409)
                .json({ message: "An account with this email already exists." });
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await usersRef.add(newAdmin);
        res
            .status(201)
            .json({ message: "Admin created successfully!", id: docRef.id });
    } catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({ message: "Failed to create admin." });
    }
}

// Updating admin credentials 
// 1) Gets the user id and the data to be updated from the request
// 2) Checks if the admin alreadt exists
// 3) Updates the data in firebase
// 4) APpropriate logs will be made in case of errors or exceptions
const updateAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { userName, email, newPassword } = req.body;

        const adminRef = db.collection("users").doc(adminId);
        const adminDoc = await adminRef.get();

        if (!adminDoc.exists) {
            return res.status(404).json({ message: "Admin not found." });
        }

        const adminData = adminDoc.data();
        if (!adminData.isAdmin) {
            return res.status(400).json({ message: "User is not an admin." });
        }

        const updateData = {};
        if (userName) updateData.userName = userName;
        if (email) updateData.email = email;
        if (newPassword) {
            updateData.hashedPassword = await passwordUtils.hashPasswords(newPassword);
        }

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await adminRef.update(updateData);

        res.status(200).json({ message: "Admin updated successfully!" });
    } catch (error) {
        console.error("Error updating admin:", error);
        res
            .status(500)
            .json({ message: "Failed to update admin.", error: error.message });
    }

}


// Deleting an admin
// 1) Gets the admin id from the request
// 2) Checks if admin exists
// 3) Aborts if the user id is a super admin
// 4) Deletes the account
// 5) In case of errors or exceptions, appropriate logs are made
const deleteAdmin = async(req, res) => {
    try {
      const { adminId } = req.params;

      const adminRef = db.collection("users").doc(adminId);
      const adminDoc = await adminRef.get();

      if (!adminDoc.exists) {
        return res.status(404).json({ message: "Admin not found." });
      }

      const adminData = adminDoc.data();
      if (!adminData.isAdmin) {
        return res.status(400).json({ message: "User is not an admin." });
      }

      if (adminData.isSuper) {
        return res
          .status(400)
          .json({ message: "Cannot delete a super admin." });
      }

      await adminRef.delete();

      res.status(200).json({ message: "Admin deleted successfully!" });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res
        .status(500)
        .json({ message: "Failed to delete admin.", error: error.message });
    }
}

// Fetches all admins
// 1) Gets all users from firebase where 'isAdmin' is true
// 2) Sends the data back to super admin
// 3) In case of errors or exceptions, appropriate logs are made
const getAdmins = async(req, res) => {
    try {
    const snapshot = await db
      .collection("users")
      .where("isAdmin", "==", true)
      .get();
    const admins = [];
    snapshot.forEach((doc) => {
      const adminData = doc.data();
      admins.push({
        id: doc.id,
        userName: adminData.userName,
        email: adminData.email,
        isAdmin: adminData.isAdmin,
        isSuper: adminData.isSuper || false,
        createdAt: adminData.createdAt,
      });
    });
    res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch admins.", error: error.message });
  }
}

module.exports = {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdmins
}