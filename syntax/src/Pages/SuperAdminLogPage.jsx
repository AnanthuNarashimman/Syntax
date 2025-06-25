import { useState } from "react";
import '../Styles/PageStyles/SuperAdminLogPage.css';
import { Button } from "../Components/Button.jsx";

function SuperAdminLogPage() {
    const loginData = {
        title: "Super Admin Login",
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
        question: "Not a super Admin?",
        buttonText: "Click here",
    };

    return (
        <div className="desktop-container">
            <div className="super-desktop-right">
                <div className="super-card">
                    <div className="super-text">
                        <div className="super-top-bar"></div>
                        <span>Not a</span>
                        <br />
                        <span className="highlight">Super Admin ?</span>
                    </div>
                    <Button className="super-button">{adminData.buttonText}</Button>
                </div>
            </div>

            <div className="super-desktop-left">
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

export default SuperAdminLogPage
