import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  Eye, 
  Trash2, 
  Calendar,
  Users,
  Clock,
  MapPin
} from 'lucide-react';
import SuperAdminNavbar from '../Components/SuperAdminNavbar';
import '../Styles/PageStyles/SuperManageContests.css';
import { useAlert } from '../contexts/AlertContext';

function SuperManageContests() {
  const { showSuccess, showError } = useAlert();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContest, setSelectedContest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contestToDelete, setContestToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/contests', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contests');
      }

      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Error fetching contests:', error);
      showError('Failed to load contest list');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContest = (contest) => {
    setSelectedContest(contest);
    setShowViewModal(true);
  };

  const handleDeleteContest = (contest) => {
    setContestToDelete(contest);
    setShowDeleteModal(true);
  };

  const confirmDeleteContest = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/super-admin/contests/${contestToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete contest');
      }

      showSuccess('Contest deleted successfully!');
      setShowDeleteModal(false);
      setContestToDelete(null);
      fetchContests(); // Refresh the list
    } catch (error) {
      console.error('Error deleting contest:', error);
      showError(error.message || 'Failed to delete contest');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredContests = contests.filter(contest =>
    contest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contest.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contest.eventMode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug: log all contest data
  console.log('Contests:', contests);

  // Updated formatDate to handle Firestore timestamps
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp?._seconds) {
      // Firestore Timestamp object
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else {
      return 'N/A';
    }
    if (isNaN(date)) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Updated getStatusBadge to use contest.status directly
  const getStatusBadge = (contest) => {
    const status = contest.status ? contest.status.toLowerCase() : 'unknown';
    let label = status.charAt(0).toUpperCase() + status.slice(1);
    let className = 'Badge StatusBadge ';
    if (status === 'ended' || status === 'completed') className += 'Completed';
    else if (status === 'active' || status === 'ongoing' || status === 'live') className += 'Active';
    else if (status === 'queue' || status === 'upcoming') className += 'Upcoming';
    else className += 'Unknown';
    return <span className={className}>{label}</span>;
  };

  if (loading) {
    return (
      <>
        <SuperAdminNavbar />
        <div className="SuperManageContests">
          <div className="LoadingState">
            <p>Loading contest list...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SuperAdminNavbar />
      <div className="SuperManageContests">
        <div className="PageHeader">
          <h1>Manage Contests</h1>
          <p>View and manage all contests and events</p>
        </div>

        <div className="ControlsSection">
          <div className="SearchBar">
            <Search className="SearchIcon" />
            <input
              type="text"
              placeholder="Search contests by title, description, or mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ContestsGrid">
          {filteredContests.map((contest) => (
            <div key={contest.id} className="ContestCard">
              <div className="ContestHeader">
                <div className="ContestIcon">
                  <Trophy className="Icon" />
                </div>
                <div className="ContestInfo">
                  <h3>{contest.title}</h3>
                  <p className="ContestDescription">
                    {contest.description?.length > 100 
                      ? `${contest.description.substring(0, 100)}...` 
                      : contest.description}
                  </p>
                  <div className="ContestBadges">
                    {getStatusBadge(contest)}
                    {contest.mode ? (
                      <span className="Badge ModeBadge">{contest.mode.charAt(0).toUpperCase() + contest.mode.slice(1)}</span>
                    ) : (
                      <span className="Badge ModeBadge" style={{color:'#aaa'}}>N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ContestDetails">
                <div className="DetailItem">
                  <Users className="DetailIcon" />
                  <span>Participants: {contest.participants || 0}</span>
                </div>
                {contest.location && (
                  <div className="DetailItem">
                    <MapPin className="DetailIcon" />
                    <span>Location: {contest.location}</span>
                  </div>
                )}
                <div className="DetailItem">
                  <Calendar className="DetailIcon" />
                  <span>Created: {formatDate(contest.createdAt)}</span>
                </div>
              </div>

              <div className="ContestActions">
                <button
                  className="BtnView"
                  onClick={() => handleViewContest(contest)}
                >
                  <Eye className="ActionIcon" />
                  View Details
                </button>
                <button
                  className="BtnDelete"
                  onClick={() => handleDeleteContest(contest)}
                >
                  <Trash2 className="ActionIcon" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredContests.length === 0 && (
          <div className="EmptyState">
            <Trophy className="EmptyIcon" />
            <h3>No contests found</h3>
            <p>No contests match your search criteria.</p>
          </div>
        )}

        {/* View Contest Modal */}
        {showViewModal && selectedContest && (
          <div className="ModalOverlay">
            <div className="ModalContent">
              <div className="ModalHeader">
                <h3>Contest Details: {selectedContest.title}</h3>
                <button 
                  className="CloseButton" 
                  onClick={() => setShowViewModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="ModalBody">
                <div className="ContestDetailsModal">
                  <div className="DetailRow">
                    <span className="DetailLabel">Title:</span>
                    <span className="DetailValue">{selectedContest.title}</span>
                  </div>
                  <div className="DetailRow">
                    <span className="DetailLabel">Description:</span>
                    <span className="DetailValue">{selectedContest.description}</span>
                  </div>
                  <div className="DetailRow">
                    <span className="DetailLabel">Event Mode:</span>
                    <span className="DetailValue">{selectedContest.mode ? selectedContest.mode.charAt(0).toUpperCase() + selectedContest.mode.slice(1) : 'N/A'}</span>
                  </div>
                  <div className="DetailRow">
                    <span className="DetailLabel">Participants:</span>
                    <span className="DetailValue">{selectedContest.participants || 0}</span>
                  </div>
                  {selectedContest.location && (
                    <div className="DetailRow">
                      <span className="DetailLabel">Location:</span>
                      <span className="DetailValue">{selectedContest.location}</span>
                    </div>
                  )}
                  <div className="DetailRow">
                    <span className="DetailLabel">Status:</span>
                    <span className="DetailValue">{selectedContest.status ? selectedContest.status.charAt(0).toUpperCase() + selectedContest.status.slice(1) : 'N/A'}</span>
                  </div>
                  <div className="DetailRow">
                    <span className="DetailLabel">Created By:</span>
                    <span className="DetailValue">{selectedContest.createdBy || 'Unknown'}</span>
                  </div>
                  <div className="DetailRow">
                    <span className="DetailLabel">Created At:</span>
                    <span className="DetailValue">{formatDate(selectedContest.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="ModalActions">
                <button 
                  className="BtnSecondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && contestToDelete && (
          <div className="ModalOverlay">
            <div className="ModalContent">
              <div className="ModalHeader">
                <h3>Delete Contest</h3>
                <button 
                  className="CloseButton" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="ModalBody">
                <p>Are you sure you want to delete the contest <strong>"{contestToDelete.title}"</strong>?</p>
                <p className="WarningText">This action cannot be undone and will permanently remove the contest and all associated data.</p>
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
                  onClick={confirmDeleteContest}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Contest'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SuperManageContests; 