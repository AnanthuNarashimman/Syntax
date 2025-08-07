import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../contexts/AlertContext";

import { Button } from "../Components/Button.jsx";
import '../Styles/PageStyles/StudentLogPage.css';

export const StudentLogPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  const loginData = {
    title: "Student Login",
    heading: "Login to your Account",
    subheading: "Enter. Compete. Conquer!",
    emailLabel: "Email",
    emailPlaceholder: "studentID",
    passwordLabel: "Password",
    passwordPlaceholder: "*****************",
    forgotPassword: "Forgot Password?",
    loginButton: "Login",
    registerText: "Not Registered Yet ?",
    createAccount: "Create an account",
    brandName: "< SYNTAX />",
  };

  const adminData = {
    question: "Are you an Admin ?",
    buttonText: "Click here",
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.email || !formData.password) {
      showError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for JWT cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Login failed with status: ${response.status}`);
      }

      console.log('Login successful:', data);

      // Show success message
      showSuccess(`Welcome back, ${data.user.userName}! Redirecting to dashboard...`);

      // Auto-redirect after showing success message
      setTimeout(() => {
        navigate('/student-home');
      }, 2000);

    } catch (err) {
      console.error('Login failed:', err.message);
      showError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="desktop-container">
      <div className="desktop-left">
        <div className="admin-card">
          <div className="admin-text">
            <div className="admin-top-bar"></div>
            <span>Are you an</span>
            <br />
            <span className="highlight">Admin ?</span>
          </div>
          <Button className="admin-button" onClick={() => navigate('/admin-login')}>
            {adminData.buttonText}
          </Button>
        </div>
      </div>

      <div className="desktop-right">
        <form className="login-form" onSubmit={handleLogin}>
          <div className="brand-name">{loginData.brandName}</div>

          <div className="login-title">{loginData.title}</div>

          <div className="login-heading">
            <div className="heading-main">{loginData.heading}</div>
            <div className="heading-sub">{loginData.subheading}</div>
          </div>

          <div className="form-group">
            <label className={formData.email ? "active" : ""}>{loginData.emailLabel}</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
              required
              placeholder=""
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className={`passwordLabel${formData.password ? " active" : ""}`}>{loginData.passwordLabel}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-field"
              required
              placeholder=""
              autoComplete="off"
            />
            <div className="forgot-password">{loginData.forgotPassword}</div>
          </div>

          <Button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Logging In...' : loginData.loginButton}
          </Button>

          <div className="register-link">
            <span>{loginData.registerText}</span>
            <span onClick={() => navigate("/register")} className="create-account">
              {loginData.createAccount}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
