import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import '../Styles/PageStyles/AdminLogPage.css';
import { Button } from "../Components/Button.jsx";
import CustomAlert from "../Components/CustomAlert.jsx"; // Import the CustomAlert component
import { useAlert } from '../contexts/AlertContext';

function AdminLogPage() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useAlert();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);

    const loginData = {
        title: "Admin Login",
        heading: "Login to your Account",
        subheading: "Enter. Compete. Conquer!",
        emailLabel: "Email",
        emailPlaceholder: "AdminID",
        passwordLabel: "Password",
        passwordPlaceholder: "*",
        forgotPassword: "Forgot Password?",
        loginButton: "Login",
        registerText: "Not Registered Yet ?",
        createAccount: "Create an account",
        brandName: "< SYNTAX />",
    };

    const adminData = {
        question: "Are you a Student ?",
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

        setLoading(true);

        try {
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            showSuccess(data.message || 'Login successful!');
            console.log('Login successful:', data);

            // Auto-redirect after showing success message
            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 2000);

        } catch (err) {
            console.error('Login failed:', err.message);
            showError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            showSuccess('Logged out successfully!');
            console.log('Logged out successfully.');

            // Auto-redirect after showing success message
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            console.error('Logout failed:', err.message);
            showError(err.message || 'An unexpected error occurred during logout.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="desktop-container">
            <div className="admin-desktop-right">
                <div className="student-card">
                    <div className="student-text">
                        <div className="student-top-bar"></div>
                        <span>Are you a</span>
                        <br />
                        <span className="highlight">Student ?</span>
                    </div>
                    <Button className="student-button" onClick={() => navigate('/student-login')}>
                        {adminData.buttonText}
                    </Button>
                </div>
                <button
                  className="tick-button"
                  onClick={() => navigate('/super-login')}
                  aria-label="Confirm"
                >
                  {/* invisible button, no symbol */}
                </button>
            </div>

            <div className="admin-desktop-left">
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
                        <label className={`passwordLabel${formData.password ? " active" : ""}`}>Password</label>
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

            {/* Custom Alert Component */}
        </div>
    );
}

export default AdminLogPage;