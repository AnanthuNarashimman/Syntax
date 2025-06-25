import { useState } from "react";
import '../Styles/PageStyles/AdminLogPage.css';
import { Button } from "../Components/Button.jsx";

function AdminLogPage() {
    const loginData = {
        title: "Admin Login",
        heading: "Login to your Account",
        subheading: "Enter. Compete. Conquer!",
        emailLabel: "Email",
        emailPlaceholder: "AdminID",
        passwordLabel: "Password",
        passwordPlaceholder: "*****************",
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
                <div className="login-form">
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
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label className="passwordLabel">{loginData.passwordLabel}</label>
                        <input
                            type="password"
                            className="input-field"
                        />
                        <div className="forgot-password">{loginData.forgotPassword}</div>
                    </div>

                    <Button className="login-button">{loginData.loginButton}</Button>

                    <div className="register-link">
                        <span>{loginData.registerText}</span>
                        <span onClick={() => navigate("/register")} className="create-account">
                            {loginData.createAccount}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogPage
