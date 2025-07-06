import { useNavigate } from "react-router-dom";

import { Button } from "../Components/Button.jsx";
import '../Styles/PageStyles/StudentLogPage.css';

export const StudentLogPage = () => {
  const navigate = useNavigate();
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
          <Button className="admin-button">{adminData.buttonText}</Button>
        </div>
      </div>

      <div className="desktop-right">
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
};
