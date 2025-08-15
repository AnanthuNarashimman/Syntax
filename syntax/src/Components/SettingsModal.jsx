import { useState } from "react";
import { User, Lock, Eye, EyeOff, Save, X } from "lucide-react";
import styles from "../Styles/ComponentStyles/SettingsModal.module.css";

export default function SettingsModal({ onClose, currentUsername }) {
  const [activeTab, setActiveTab] = useState("username"); // "username" or "password"
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username change form
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Validate username
  const validateUsername = (username) => {
    if (!username.trim()) {
      return "Username is required";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (username.length > 20) {
      return "Username must be less than 20 characters";
    }
    // if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    //   return "Username can only contain letters, numbers, and underscores";
    // }
    return "";
  };

  // Validate password
  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  // Handle username change
  const handleUsernameChange = async () => {
    const error = validateUsername(newUsername);
    if (error) {
      setUsernameError(error);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/student/profile/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update username");
      }

      // Success - close modal and refresh page
      onClose();
      window.location.reload();
    } catch (error) {
      setUsernameError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Validate current password
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/student/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update password");
      }

      // Success - close modal and show success message
      onClose();
      alert("Password updated successfully!");
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Account Settings</h2>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "username" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("username")}
            >
              <User size={16} />
              Change Username
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "password" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              <Lock size={16} />
              Change Password
            </button>
          </div>

          {/* Username Change Tab */}
          {activeTab === "username" && (
            <div className={styles.tabContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Username</label>
                <div className={styles.currentValue}>{currentUsername}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                    setUsernameError("");
                  }}
                  placeholder="Enter new username"
                  className={`${styles.input} ${
                    usernameError ? styles.inputError : ""
                  }`}
                />
                {usernameError && (
                  <div className={styles.errorMessage}>{usernameError}</div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={handleUsernameChange}
                  className={styles.saveButton}
                  disabled={isLoading || !newUsername.trim()}
                >
                  {isLoading ? "Updating..." : "Update Username"}
                </button>
              </div>
            </div>
          )}

          {/* Password Change Tab */}
          {activeTab === "password" && (
            <div className={styles.tabContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter current password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter new password"
                    className={`${styles.input} ${
                      passwordError ? styles.inputError : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={styles.eyeButton}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Confirm new password"
                    className={`${styles.input} ${
                      passwordError ? styles.inputError : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.eyeButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className={styles.errorMessage}>{passwordError}</div>
              )}

              <div className={styles.formActions}>
                <button
                  onClick={handlePasswordChange}
                  className={styles.saveButton}
                  disabled={
                    isLoading ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
}
