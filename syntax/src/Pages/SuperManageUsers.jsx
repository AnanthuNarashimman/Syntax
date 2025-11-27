import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  User,
  Mail,
  Calendar
} from 'lucide-react';
import SuperAdminNavbar from '../Components/SuperAdminNavbar';
import '../Styles/PageStyles/SuperManageUsers.css';
import { useAlert } from '../contexts/AlertContext';

function SuperManageUsers() {
  const { showSuccess, showError } = useAlert();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    userName: '',
    email: '',
    newPassword: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ userName: '', email: '', password: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/admins', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      showError('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditForm({
      userName: admin.userName || '',
      email: admin.email || '',
      newPassword: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateAdmin = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/super-admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update admin');
      }

      showSuccess('Admin updated successfully!');
      setShowEditModal(false);
      setEditingAdmin(null);
      setEditForm({ userName: '', email: '', newPassword: '' });
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error('Error updating admin:', error);
      showError(error.message || 'Failed to update admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDeleteAdmin = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/super-admin/admins/${adminToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete admin');
      }

      showSuccess('Admin deleted successfully!');
      setShowDeleteModal(false);
      setAdminToDelete(null);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error('Error deleting admin:', error);
      showError(error.message || 'Failed to delete admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    setAddError('');
    setAddSuccess('');
    if (!addForm.userName || !addForm.email || !addForm.password) {
      setAddError('All fields are required.');
      return;
    }
    setAddLoading(true);
    try {
      const response = await fetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add admin');
      }
      setAddSuccess('Admin added successfully!');
      setAddForm({ userName: '', email: '', password: '' });
      fetchAdmins();
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1000);
    } catch (error) {
      setAddError(error.message || 'Failed to add admin');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <SuperAdminNavbar />
        <div className="SuperManageUsers">
          <div className="LoadingState">
            <p>Loading admin list...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SuperAdminNavbar />
      <div className="SuperManageUsers">
        <div className="PageHeader">
          <h1>Manage Users</h1>
          <p>View and manage administrator accounts</p>
        </div>

        <div className="ControlsSection">
          <div className="SearchBar">
            <Search className="SearchIcon" />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="BtnPrimary AddAdminBtn" onClick={() => setShowAddModal(true)}>
            + Add Admin
          </button>
        </div>

        <div className="AdminsGrid">
          {filteredAdmins.map((admin) => (
            <div key={admin.id} className="AdminCard">
              <div className="AdminHeader">
                <div className="AdminAvatar">
                  <Shield className="AvatarIcon" />
                </div>
                <div className="AdminInfo">
                  <h3>{admin.userName}</h3>
                  <p className="AdminEmail">{admin.email}</p>
                  <div className="AdminBadges">
                    {admin.isSuper && (
                      <span className="Badge SuperBadge">Super Admin</span>
                    )}
                    <span className="Badge AdminBadge">Administrator</span>
                  </div>
                </div>
              </div>

              <div className="AdminDetails">
                <div className="DetailItem">
                  <Calendar className="DetailIcon" />
                  <span>Joined: {formatDate(admin.createdAt)}</span>
                </div>
              </div>

              <div className="AdminActions">
                <button
                  className="BtnEdit"
                  onClick={() => handleEditAdmin(admin)}
                  disabled={admin.isSuper}
                >
                  <Edit className="ActionIcon" />
                  Edit
                </button>
                <button
                  className="BtnDelete"
                  onClick={() => handleDeleteAdmin(admin)}
                  disabled={admin.isSuper}
                >
                  <Trash2 className="ActionIcon" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAdmins.length === 0 && (
          <div className="EmptyState">
            <Users className="EmptyIcon" />
            <h3>No admins found</h3>
            <p>No administrators match your search criteria.</p>
          </div>
        )}

        {/* Edit Admin Modal */}
        {showEditModal && editingAdmin && (
          <div className="ModalOverlay">
            <div className="ModalContent">
              <div className="ModalHeader">
                <h3>Edit Admin: {editingAdmin.userName}</h3>
                <button 
                  className="CloseButton" 
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="ModalBody">
                <div className="FormGroup">
                  <label>Username</label>
                  <input
                    type="text"
                    value={editForm.userName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>

                <div className="FormGroup">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                  />
                </div>

                <div className="FormGroup">
                  <label>New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="ModalActions">
                <button 
                  className="BtnSecondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="BtnPrimary" 
                  onClick={handleUpdateAdmin}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating...' : 'Update Admin'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && adminToDelete && (
          <div className="ModalOverlay">
            <div className="ModalContent">
              <div className="ModalHeader">
                <h3>Delete Admin</h3>
                <button 
                  className="CloseButton" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="ModalBody">
                <p>Are you sure you want to delete the admin account for <strong>{adminToDelete.userName}</strong>?</p>
                <p className="WarningText">This action cannot be undone and will permanently remove the admin account.</p>
              </div>

              <div className="ModalActions">
                <button 
                  className="BtnSecondary" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="BtnDanger" 
                  onClick={confirmDeleteAdmin}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Admin'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Admin Modal */}
        {showAddModal && (
          <div className="ModalOverlay">
            <div className="ModalContent">
              <div className="ModalHeader">
                <h3>Add New Admin</h3>
                <button className="CloseButton" onClick={() => setShowAddModal(false)} disabled={addLoading}>
                  ×
                </button>
              </div>
              <div className="ModalBody">
                <div className="FormGroup">
                  <label>Username</label>
                  <input
                    type="text"
                    value={addForm.userName}
                    onChange={e => setAddForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Enter username"
                    disabled={addLoading}
                  />
                </div>
                <div className="FormGroup">
                  <label>Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                    disabled={addLoading}
                  />
                </div>
                <div className="FormGroup">
                  <label>Password</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    disabled={addLoading}
                  />
                </div>
                {addError && <div className="WarningText">{addError}</div>}
                {addSuccess && <div className="AlertSuccess">{addSuccess}</div>}
              </div>
              <div className="ModalActions">
                <button className="BtnSecondary" onClick={() => setShowAddModal(false)} disabled={addLoading}>
                  Cancel
                </button>
                <button className="BtnPrimary" onClick={handleAddAdmin} disabled={addLoading}>
                  {addLoading ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SuperManageUsers; 