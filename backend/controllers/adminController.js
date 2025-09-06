const { db, admin } = require("../config/firebase");

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
            updateData.hashedPassword = await hashPassword(newPassword);
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