import '../Styles/PageStyles/AdminProfile.css';
import { User, Home, Plus, Settings, Users, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import { useEffect } from 'react';


function AdminProfile() {

    const [activeTab, setActiveTab] = useState('profile');

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'create', label: 'Create Contest', icon: Plus },
        { id: 'manage', label: 'Manage Events', icon: Settings },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const [userName, setUserName] = useState('Fetching...');
    const [userMail, setUserMail] = useState('Fetching...');
    const [passwordPlaceholder, setPasswordPlaceholder] = useState('Fetching...');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData.message);
            }

            const data = await response.json();
            setUserName(data.userName);
            setUserMail(data.mail);
            setPasswordPlaceholder('••••••••••••');
        } catch (err) {
            console.log(err.message);
        }
    };

    const passCheck = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setMessage('');

        try {
            const oldPassword = currentPassword;
            const response = await fetch('/api/verify/pass-verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword: oldPassword }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    errorData = { message: await response.text() || `Server error (status: ${response.status})` };
                }
                setMessage('Current password is incorrect');
                setIsPasswordVerified(false);
                return;
            }

            const data = await response.json();
            if (data.PasswordMatch) {
                setIsPasswordVerified(true);
                setMessage('Password verified! You can now set a new password.');
            } else {
                setMessage('Current password is incorrect');
                setIsPasswordVerified(false);
            }
        } catch (err) {
            setMessage('Error verifying password. Please try again.');
            setIsPasswordVerified(false);
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePasswordChange = async(e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long');
            return;
        }

        console.log('Password change attempted');

        try {
        const response = await fetch('/api/update/pass-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({newPassword: newPassword}),
        });

        if(!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch(jsonError) {
                errorData = response.text() || response.status;
                console.log(errorData);
            }
        }

        const data = await response.json();
        console.log(data);
    } catch(err) {
        console.log(err.message);
    }


        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);
        setIsPasswordVerified(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleCancel = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);
        setIsPasswordVerified(false);
        setMessage('');
    };

    return (
        <>
            <AdminNavbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarItems={sidebarItems}
            />
            <div className="profilePage">
                <div className="profileHeader">
                    <h1>Admin Profile</h1>
                    <p>Review your account information and security</p>
                </div>

                <div className="profileContent">
                    <div className="profileCard">
                        <div className="cardHeader">
                            <h2>Account Information</h2>
                        </div>

                        <div className="cardBody">
                            <div className="formGroup">
                                <label className="formLabel">Username</label>
                                <div className="inputContainer">
                                    <input
                                        type="text"
                                        value={userName}
                                        disabled
                                        className="formInput disabled"
                                    />
                                    <span className="disabledText">Username cannot be changed</span>
                                </div>
                            </div>

                            <div className="formGroup">
                                <label className="formLabel">Email Address</label>
                                <div className="inputContainer">
                                    <input
                                        type="email"
                                        value={userMail}
                                        disabled
                                        className="formInput disabled"
                                    />
                                    <span className="disabledText">Email cannot be changed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profileCard">
                        <div className="cardHeader">
                            <h2>Security Settings</h2>
                        </div>

                        <div className="cardBody">
                            {!isEditing ? (
                                <div className="passwordSection">
                                    <div className="formGroup">
                                        <label className="formLabel">Password</label>
                                        <div className="passwordDisplay">
                                            <span>{passwordPlaceholder}</span>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="changePasswordBtn"
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="passwordForm">
                                    <div className="formGroup">
                                        <label className="formLabel">Current Password</label>
                                        <div className="passwordInputContainer">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="formInput"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="passwordToggle"
                                            >
                                                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="checkPw"
                                        onClick={passCheck}
                                        disabled={!currentPassword || isVerifying}
                                    >
                                        {isVerifying ? 'Verifying...' : 'Verify Password'}
                                    </button>

                                    <div className="formGroup">
                                        <label className="formLabel">New Password</label>
                                        <div className="passwordInputContainer">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="formInput"
                                                required
                                                minLength="6"
                                                disabled={!isPasswordVerified}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="passwordToggle"
                                                disabled={!isPasswordVerified}
                                            >
                                                {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="formGroup">
                                        <label className="formLabel">Confirm New Password</label>
                                        <div className="passwordInputContainer">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="formInput"
                                                required
                                                minLength="6"
                                                disabled={!isPasswordVerified}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="passwordToggle"
                                                disabled={!isPasswordVerified}
                                            >
                                                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="formActions">
                                        <button
                                            type="button"
                                            onClick={handlePasswordChange}
                                            className="saveBtn"
                                            disabled={!isPasswordVerified || !newPassword || !confirmPassword}
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="cancelBtn"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className={`message ${message.includes('successfully') || message.includes('verified') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AdminProfile
