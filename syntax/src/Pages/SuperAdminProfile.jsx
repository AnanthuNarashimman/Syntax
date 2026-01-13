import { useState, useEffect } from 'react';
import { Shield, Save, X, Eye, EyeOff } from 'lucide-react';
import SuperAdminNavbar from '../Components/SuperAdminNavbar';
import '../Styles/PageStyles/SuperAdminProfile.css';
import { useAlert } from '../contexts/AlertContext';

function SuperAdminProfile() {
  const { showSuccess, showError } = useAlert();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/profile', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setFormData({
        userName: data.profile.userName || '',
        email: data.profile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setActionLoading(true);
      setAlert(null);

      // Validate password change if attempting to change password
      if (!formData.currentPassword) {
        setAlert({ type: 'error', message: 'Current password is required to change password' });
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setAlert({ type: 'error', message: 'New passwords do not match' });
        return;
      }
      if (formData.newPassword.length < 6) {
        setAlert({ type: 'error', message: 'New password must be at least 6 characters' });
        return;
      }

      const response = await fetch('/api/super-admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      showSuccess('Profile updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      userName: profile.userName || '',
      email: profile.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setAlert(null);
  };

  if (loading) {
    return (
      <>
        <SuperAdminNavbar />
        <div className="SuperAdminProfile">
          <div className="LoadingState">
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SuperAdminNavbar />
        <div className="SuperAdminProfile">
          <div className="LoadingState">
            <p>Profile not found</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SuperAdminNavbar />
      <div className="SuperAdminProfile">
        <div className="PageHeader">
          <h1>Super Admin Profile</h1>
          <p>Manage your account security</p>
        </div>

        <div className="ProfileContainer">
          {/* Profile Card */}
          <div className="ProfileCard">
            <div className="ProfileAvatar">
              <Shield className="AvatarIcon" />
            </div>
            <h2 className="ProfileName">{profile.userName}</h2>
            <p className="ProfileRole">Super Administrator</p>
            <div className="ProfileStats">
              <div className="StatItem">
                <div className="StatValue">∞</div>
                <div className="StatLabel">System Access</div>
              </div>
              <div className="StatItem">
                <div className="StatValue">∞</div>
                <div className="StatLabel">Admin Control</div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="SettingsSection">
            <div className="SettingsHeader">
              <h2>Account Security</h2>
            </div>
            <div className="SettingsContent">
              {alert && (
                <div className={`Alert ${alert.type === 'error' ? 'AlertError' : 'AlertSuccess'}`}>
                  {alert.message}
                </div>
              )}
              <div className="SettingsForm">
                <div className="FormGroup">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="readonly"
                  />
                </div>
                <div className="PasswordSection">
                  <h3>Change Password</h3>
                  <div className="PasswordFields">
                    <div className="FormGroup">
                      <label>Current Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          placeholder="Enter current password"
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666'
                          }}
                        >
                          {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="FormGroup">
                      <label>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="Enter new password"
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666'
                          }}
                        >
                          {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="FormGroup">
                      <label>Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm new password"
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666'
                          }}
                        >
                          {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="FormActions">
                  <button
                    className="BtnPrimary"
                    onClick={handleSaveProfile}
                    disabled={actionLoading}
                  >
                    <Save className="ActionIcon" />
                    {actionLoading ? 'Saving...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SuperAdminProfile; 