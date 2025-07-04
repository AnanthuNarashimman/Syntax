import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import '../Styles/PageStyles/AdminLogPage.css';
import { Button } from "../Components/Button.jsx";

function AdminLogPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
        setError('');
        setSuccessMessage('');
    };

    function focus(e) {
        e.target.parentElement.querySelector('label').classList.add('active');
    }

    function notFocus(e) {
        e.target.parentElement.querySelector('label').classList.remove('active');
    }

    const handleLogin = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setSuccessMessage('');

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
            setSuccessMessage(data.message || 'Login successful!');
            console.log('Login successful:', data);

            navigate('/admin-dashboard');

        } catch (err) {
            console.error('Login failed:', err.message);
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- NEW LOGOUT FUNCTION ---
    const handleLogout = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            setSuccessMessage('Logged out successfully!');
            console.log('Logged out successfully.');

            navigate('/');

        } catch (err) {
            console.error('Logout failed:', err.message);
            setError(err.message || 'An unexpected error occurred during logout.');
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
                    <Button className="student-button">{adminData.buttonText}</Button>
                </div>
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
                        <label>{loginData.emailLabel}</label>
                        <input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="input-field"
                            required
                            onFocus={focus}
                            onBlur={notFocus}
                        />
                    </div>

                    <div className="form-group">
                        <label className="passwordLabel">{loginData.passwordLabel}</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="input-field"
                            onFocus={focus}
                            onBlur={notFocus}
                            required
                        />
                        <div className="forgot-password">{loginData.forgotPassword}</div>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                    {successMessage && <div className="success-message" style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}

                    <Button className="login-button" type="submit" disabled={loading}>
                        {loading ? 'Logging In...' : loginData.loginButton}
                    </Button>

                    <div className="register-link">
                        <span>{loginData.registerText}</span>
                        <span onClick={() => navigate("/register")} className="create-account">
                            {loginData.createAccount}
                        </span>
                    </div>

                    {/* Temporary Logout Button for testing */}
                    <Button
                        className="logout-button"
                        onClick={handleLogout}
                        disabled={loading}
                        style={{ marginTop: '20px', backgroundColor: '#dc3545', color: 'white' }}
                    >
                        {loading ? 'Logging Out...' : 'Logout'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default AdminLogPage;
