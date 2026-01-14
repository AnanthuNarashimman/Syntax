import {
  Home,
  Plus,
  Settings,
  MessageSquare,
  User,
  TrendingUp,
  Calendar,
  Award,
  Activity,
  Search,
  Filter,
  Clock,
  Users,
  Trophy,
  BookOpen,
  Brain,
  Download,
  Copy,
  Eye,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import AdminNavbar from "../Components/AdminNavbar";
import "../Styles/PageStyles/ManageContest.css";
import { useNavigate } from "react-router-dom";
import { useContestContext } from "../contexts/ContestContext";
import { useAlert } from "../contexts/AlertContext";
import { useMemo } from "react";
import * as XLSX from "xlsx";

function ManageContest() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [startEventLoading, setStartEventLoading] = useState(false);

  // Add these new state variables

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("overview");
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "points",
    direction: "descending",
  });
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantFilters, setParticipantFilters] = useState({
    department: "all",
    year: "all",
    section: "all",
  });

  // Proctoring logs state
  const [showProctoringLogsModal, setShowProctoringLogsModal] = useState(false);
  const [proctoringLogs, setProctoringLogs] = useState(null);
  const [isProctoringLogsLoading, setIsProctoringLogsLoading] = useState(false);
  const [selectedStudentForLogs, setSelectedStudentForLogs] = useState(null);

  // Reopen contest confirmation state
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [reopenData, setReopenData] = useState(null);

  // Use ContestContext
  const {
    loading,
    error,
    getCategorizedEvents,
    updateEventStatus,
    updateEventData,
    fetchEvents,
  } = useContestContext();
  const { showError, showSuccess } = useAlert();

  const [activeTab, setActiveTabState] = useState("manage");
  const navigate = useNavigate();

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    // Map tab id to route
    const tabRoutes = {
      home: "/admin-dashboard",
      create: "/create-contest",
      manage: "/manage-contest",
      participants: "/manage-participants",
      analytics: "/analytics",
      profile: "/admin-profile",
    };
    if (tabRoutes[tab]) {
      navigate(tabRoutes[tab]);
    }
  };

  const sidebarItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "create", label: "Create Contest", icon: Plus },
    { id: "manage", label: "Manage Events", icon: Settings },
    { id: "participants", label: "Participants", icon: Users },
    // { id: "analytics", label: "Analytics", icon: TrendingUp }, // Under development
    { id: "profile", label: "Profile", icon: User },
  ];

  // Refresh data when component mounts
  useEffect(() => {
    fetchEvents();
  }, []); // Empty dependency array - only run on mount

  // Get categorized events from context
  const categorizedEvents = getCategorizedEvents();
  
  // Debug: Log the first event to see its structure
  if (categorizedEvents.all.length > 0) {
    console.log("First event data:", categorizedEvents.all[0]);
  }

  const filteredEvents = categorizedEvents.all.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      ongoing: { text: "LIVE", className: "live" },
      queue: { text: "QUEUE", className: "queue" },
      ended: { text: "COMPLETED", className: "completed" },
    };
    return (
      badges[status] || { text: status.toUpperCase(), className: "default" }
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      contest: <Trophy className="type-icon" />,
      quiz: <Brain className="type-icon" />,
    };
    return icons[type] || <Trophy className="type-icon" />;
  };

  const groupedEvents = {
    contest: filteredEvents.filter((e) => e.type === "contest"),
    quiz: filteredEvents.filter((e) => e.type === "quiz"),
  };

  const handleEndEvent = (eventId) => {
    setSelectedEventId(eventId);
    setShowEndConfirm(true);
  };

  const confirmEndEvent = async () => {
    try {
      await updateEventStatus(selectedEventId, "ended");
      setShowEndConfirm(false);
      setSelectedEventId(null);
      showSuccess("Event ended successfully!");
    } catch (err) {
      showError(`Error ending event: ${err.message}`);
    }
  };

  const cancelEndEvent = () => {
    setShowEndConfirm(false);
    setSelectedEventId(null);
  };

  // In ManageContest.js

  const handleViewEvent = async (eventId) => {
    try {
      setViewLoading(true);
      setSelectedEventId(eventId);

      // Get participant count from categorized events (already has correct count)
      const existingEvent = categorizedEvents.all.find(e => e.id === eventId);
      const participantCount = existingEvent?.participants || 0;

      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }

      const data = await response.json();
      // Merge the participant count from the card data
      setSelectedEvent({
        ...data.event,
        participants: participantCount
      });
      setShowViewModal(true);
    } catch (err) {
      showError(`Error fetching event details: ${err.message}`);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    // Also clear leaderboard data on close
    setShowViewModal(false);
    setSelectedEvent(null);
    setSelectedEventId(null);
    setLeaderboardData([]);
  };

  const handleViewParticipants = async (eventId, eventTitle) => {
    try {
      setIsLeaderboardLoading(true);
      setSelectedEventId(eventId);
      // We pass eventTitle to show in the modal header
      setSelectedEvent({ eventTitle: eventTitle });
      setShowLeaderboardModal(true);

      const response = await fetch(`/api/events/${eventId}/results`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Could not fetch leaderboard data, might be empty.");
        setLeaderboardData([]);
      } else {
        const data = await response.json();
        setLeaderboardData(data);
      }
    } catch (err) {
      showError(`Error fetching participants: ${err.message}`);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const closeLeaderboardModal = () => {
    setShowLeaderboardModal(false);
    setLeaderboardData([]);
    setSelectedEvent(null);
    // Reset sort to default when closing
    setSortConfig({ key: "points", direction: "descending" });
    // Reset search and filters
    setParticipantSearch("");
    setParticipantFilters({
      department: "all",
      year: "all",
      section: "all",
    });
  };

  const sortedLeaderboardData = useMemo(() => {
    let sortableItems = [...leaderboardData];

    // Apply search filter
    if (participantSearch.trim()) {
      const searchLower = participantSearch.toLowerCase();
      sortableItems = sortableItems.filter(
        (item) =>
          item.userName?.toLowerCase().includes(searchLower) ||
          item.userEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Apply department filter
    if (participantFilters.department !== "all") {
      sortableItems = sortableItems.filter(
        (item) => item.userDepartment === participantFilters.department
      );
    }

    // Apply year filter
    if (participantFilters.year !== "all") {
      sortableItems = sortableItems.filter(
        (item) => item.userYear === parseInt(participantFilters.year)
      );
    }

    // Apply section filter
    if (participantFilters.section !== "all") {
      sortableItems = sortableItems.filter(
        (item) => item.userSection === participantFilters.section
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Handle different data types (string vs number)
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [leaderboardData, sortConfig, participantSearch, participantFilters]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleStartEvent = async (eventId) => {
    try {
      setViewLoading(true);
      setSelectedEventId(eventId);

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch event details");
      }

      const data = await response.json();
      setEditingEvent(data.event);

      // Initialize edit form data with basic event info
      const initialEditData = {
        eventTitle: data.event.eventTitle,
        eventDescription: data.event.eventDescription,
        durationMinutes: data.event.durationMinutes,
        eventMode: data.event.eventMode,
        topicsCovered: data.event.topicsCovered,
        allowedDepartments: data.event.allowedDepartments,
      };

      // Add questions or problems based on event type
      if (data.event.eventType === "quiz") {
        initialEditData.questions = data.event.questions || [];
      } else {
        initialEditData.problems = data.event.problems || [];
      }

      setEditFormData(initialEditData);
      setShowStartModal(true);
    } catch (err) {
      showError(`Error fetching event details: ${err.message}`);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, index) =>
        index === questionIndex ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setEditFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, index) =>
        index === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, optIndex) =>
                optIndex === optionIndex ? value : opt
              ),
            }
          : q
      ),
    }));
  };

  const handleProblemChange = (problemIndex, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      problems: prev.problems.map((p, index) =>
        index === problemIndex ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleProblemDetailChange = (problemIndex, detailField, value) => {
    setEditFormData((prev) => ({
      ...prev,
      problems: prev.problems.map((p, index) =>
        index === problemIndex
          ? {
              ...p,
              problemDetails: { ...p.problemDetails, [detailField]: value },
            }
          : p
      ),
    }));
  };

  const handleStarterCodeChange = (problemIndex, language, value) => {
    setEditFormData((prev) => ({
      ...prev,
      problems: prev.problems.map((p, index) =>
        index === problemIndex
          ? {
              ...p,
              starterCode: { ...p.starterCode, [language]: value },
            }
          : p
      ),
    }));
  };

  const handleExampleChange = (problemIndex, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      problems: prev.problems.map((p, index) =>
        index === problemIndex
          ? {
              ...p,
              examples: [{ ...p.examples[0], [field]: value }],
            }
          : p
      ),
    }));
  };

  const handleTestCaseChange = (problemIndex, testCaseIndex, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      problems: prev.problems.map((p, index) =>
        index === problemIndex
          ? {
              ...p,
              testCases: p.testCases.map((tc, tcIndex) =>
                tcIndex === testCaseIndex ? { ...tc, [field]: value } : tc
              ),
            }
          : p
      ),
    }));
  };

  const confirmStartEvent = async () => {
    try {
      setStartEventLoading(true);
      await updateEventData(selectedEventId, {
        ...editFormData,
        status: "active",
      });
      setShowStartModal(false);
      setSelectedEventId(null);
      setEditingEvent(null);
      setEditFormData({});
      showSuccess("Event started successfully!");
    } catch (err) {
      showError(`Error starting event: ${err.message}`);
    } finally {
      setStartEventLoading(false);
    }
  };

  const cancelStartEvent = () => {
    setShowStartModal(false);
    setSelectedEventId(null);
    setEditingEvent(null);
    setEditFormData({});
  };

  const copyContestId = async (contestId) => {
    try {
      await navigator.clipboard.writeText(contestId);
      showSuccess("Contest ID copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy contest ID:", err);
      showError("Failed to copy contest ID to clipboard");
    }
  };

  const exportToExcel = () => {
    try {
      if (!sortedLeaderboardData || sortedLeaderboardData.length === 0) {
        showError("No participant data to export");
        return;
      }

      // Prepare data for Excel export
      const excelData = sortedLeaderboardData.map((user, index) => ({
        "S No": index + 1,
        Name: user.userName,
        Email: user.userEmail,
        Department: user.userDepartment,
        Year: user.userYear,
        Section: user.userSection,
        Score: user.points,
        "Submitted At": new Date(user.submittedAt).toLocaleString(),
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [
        { wch: 6 },  // S No
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Department
        { wch: 8 },  // Year
        { wch: 10 }, // Section
        { wch: 10 }, // Score
        { wch: 20 }, // Submitted At
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

      // Generate filename with contest name
      const contestName = selectedEvent?.eventTitle || "Contest";
      const safeContestName = contestName.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeContestName}_Participants.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      showSuccess(`Excel file "${filename}" downloaded successfully!`);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      showError("Failed to export data to Excel");
    }
  };

  // Fetch proctoring logs for a specific student
  const handleViewProctoringLogs = async (studentId, studentName, contestId) => {
    try {
      setIsProctoringLogsLoading(true);
      setSelectedStudentForLogs({ id: studentId, name: studentName });
      setShowProctoringLogsModal(true);

      const response = await fetch(
        `/api/proctoring/student/${studentId}/contest/${contestId}/violations`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch proctoring logs");
      }

      const data = await response.json();
      setProctoringLogs(data);
    } catch (err) {
      showError(`Error fetching proctoring logs: ${err.message}`);
      setProctoringLogs(null);
    } finally {
      setIsProctoringLogsLoading(false);
    }
  };

  const closeProctoringLogsModal = () => {
    setShowProctoringLogsModal(false);
    setProctoringLogs(null);
    setSelectedStudentForLogs(null);
  };

  // Reopen contest for a specific user
  const handleReopenForUser = (userId, userName, contestId) => {
    setReopenData({ userId, userName, contestId });
    setShowReopenConfirm(true);
  };

  const confirmReopenContest = async () => {
    if (!reopenData) return;

    const { userId, userName, contestId } = reopenData;

    try {
      setShowReopenConfirm(false);
      const response = await fetch('/api/admin/reopen-contest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          eventId: contestId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reopen contest');
      }

      const data = await response.json();
      showSuccess(`Contest reopened for ${userName}. They can now retake it.`);

      // Refresh the leaderboard data to remove the reopened user
      handleViewParticipants(contestId, selectedEvent?.eventTitle);
    } catch (error) {
      console.error('Error reopening contest:', error);
      showError(`Failed to reopen contest: ${error.message}`);
    } finally {
      setReopenData(null);
    }
  };

  const cancelReopenContest = () => {
    setShowReopenConfirm(false);
    setReopenData(null);
  };

  return (
    <>
      <AdminNavbar />
      <div className="manage-contest-page">
        <div className="page-header">
          <h1>Manage Contests</h1>
          <p>
            Organize and monitor your coding contests, quizzes, and practice
            sessions
          </p>
        </div>

        <div className="controls-section">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search contests, quizzes, or practice sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-section">
            <Filter className="filter-icon" />
            <div className="filter-buttons">
              <button
                className={statusFilter === "all" ? "active" : ""}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                className={statusFilter === "queue" ? "active" : ""}
                onClick={() => setStatusFilter("queue")}
              >
                Queue
              </button>
              <button
                className={statusFilter === "ongoing" ? "active" : ""}
                onClick={() => setStatusFilter("ongoing")}
              >
                Active
              </button>
              <button
                className={statusFilter === "ended" ? "active" : ""}
                onClick={() => setStatusFilter("ended")}
              >
                Ended
              </button>
            </div>
          </div>
        </div>

        {/* Conditional rendering for loading, error, and empty states */}
        {loading && (
          <div className="loading-state">
            <p>Loading contests...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>Error: {error}</p>
            <p>
              Please ensure you are logged in as an admin and the server is
              running correctly.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="content-sections">
            {Object.entries(groupedEvents).map(
              ([type, items]) =>
                items.length > 0 && (
                  <div key={type} className="section">
                    <div className="section-header">
                      <h2>
                        {getTypeIcon(type)}
                        {type.charAt(0).toUpperCase() + type.slice(1)}s
                        <span className="count">({items.length})</span>
                      </h2>
                    </div>

                    <div className="cards-grid">
                      {items.map((item) => (
                        <div key={item.id} className="contest-card">
                          <div className="card-header">
                            <div className="card-title">
                              <h3>{item.title}</h3>
                              <div className="mode-badge">
                                {item.eventMode === "strict"
                                  ? "Exam Mode"
                                  : "Practice Mode"}
                              </div>
                            </div>
                            <div
                              className={`status-badge ${
                                getStatusBadge(item.status).className
                              }`}
                            >
                              {getStatusBadge(item.status).text}
                            </div>
                          </div>

                          <p className="card-description">{item.description}</p>

                          <div className="card-footer">
                            <div className={`participants ${item.status === "ongoing" ? "active" : item.status === "ended" ? "ended" : "queue"}`}>
                              <Users className="icon" />
                              <span className="participant-count">
                                {item.participants || 0}
                              </span>
                              <span className="participant-label">
                                {(item.participants || 0) === 1 ? "participant" : "participants"}
                              </span>
                            </div>
                            <div className="time-info">
                              <Clock className="icon" />
                              <span>{item.timeLeft}</span>
                            </div>
                          </div>

                          <div className="contest-id-section">
                            <div className="contest-id-label">Contest ID:</div>
                            <div className="contest-id-container">
                              <span className="contest-id-text">{item.id}</span>
                              <button
                                className="copy-button"
                                onClick={() => copyContestId(item.id)}
                                title="Copy Contest ID"
                              >
                                <Copy size={17}/>
                              </button>
                            </div>
                          </div>

                          <div className="card-actions">
                            {item.status === "queue" && (
                              <button
                                className="btn-success"
                                onClick={() => handleStartEvent(item.id)}
                              >
                                Start Event
                              </button>
                            )}
                            {item.status === "ongoing" && (
                              <button
                                className="btn-danger"
                                onClick={() => handleEndEvent(item.id)}
                              >
                                End
                              </button>
                            )}
                            <button
                              className="btn-primary"
                              onClick={() => handleViewEvent(item.id)}
                            >
                              View
                            </button>

                            {(item.status === "ongoing" ||
                              item.status === "ended") && (
                              <button
                                className="btn-info"
                                onClick={() =>
                                  handleViewParticipants(item.id, item.title)
                                }
                              >
                                Participants
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="empty-state">
            <p>No events found matching your criteria.</p>
          </div>
        )}

        {/* End Event Confirmation Modal */}
        {showEndConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>End Event</h3>
              <p>
                Are you sure you want to end this event? This action cannot be
                undone.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={cancelEndEvent}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={confirmEndEvent}>
                  Yes, End Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Contest Confirmation Modal */}
        {showReopenConfirm && reopenData && (
          <div className="modal-overlay reopen-modal-overlay">
            <div className="modal-content reopen-confirm-modal">
              <div className="modal-header">
                <h3>
                  <Activity size={20} style={{ marginRight: '8px' }} />
                  Reopen Contest
                </h3>
              </div>
              <div className="reopen-confirm-content">
                <p className="confirm-message">
                  Are you sure you want to reopen this contest for{' '}
                  <strong>{reopenData.userName}</strong>?
                </p>
                <div className="warning-box">
                  <AlertTriangle size={18} />
                  <div className="warning-content">
                    <p className="warning-title">This action will:</p>
                    <ul>
                      <li>Delete their previous submission</li>
                      <li>Reset their attempt status to "not started"</li>
                      <li>Revert their score from this contest</li>
                      <li>Clear their proctoring logs</li>
                      <li>Allow them to retake the contest</li>
                    </ul>
                    <p className="warning-note">
                      <strong>Note:</strong> This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={cancelReopenContest}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={confirmReopenContest}>
                  <Activity size={16} style={{ marginRight: '6px' }} />
                  Yes, Reopen Contest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard / Participants Modal */}
        {showLeaderboardModal && (
          <div className="modal-overlay">
            <div className="modal-content event-details-modal participants-modal">
              <div className="modal-header">
                <h3>Participants for: {selectedEvent?.eventTitle}</h3>
                <button
                  className="close-button"
                  onClick={closeLeaderboardModal}
                >
                  ×
                </button>
              </div>

              {/* Search and Filter Controls */}
              {!isLeaderboardLoading && leaderboardData.length > 0 && (
                <div className="participants-controls">
                  <div className="participants-search-bar">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="participants-search-input"
                    />
                  </div>

                  <div className="participants-filters">
                    <select
                      value={participantFilters.department}
                      onChange={(e) =>
                        setParticipantFilters((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      className="filter-select"
                    >
                      <option value="all">All Departments</option>
                      {[
                        ...new Set(
                          leaderboardData.map((p) => p.userDepartment)
                        ),
                      ]
                        .filter(Boolean)
                        .sort()
                        .map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                    </select>

                    <select
                      value={participantFilters.year}
                      onChange={(e) =>
                        setParticipantFilters((prev) => ({
                          ...prev,
                          year: e.target.value,
                        }))
                      }
                      className="filter-select"
                    >
                      <option value="all">All Years</option>
                      {[
                        ...new Set(leaderboardData.map((p) => p.userYear)),
                      ]
                        .filter(Boolean)
                        .sort()
                        .map((year) => (
                          <option key={year} value={year}>
                            Year {year}
                          </option>
                        ))}
                    </select>

                    <select
                      value={participantFilters.section}
                      onChange={(e) =>
                        setParticipantFilters((prev) => ({
                          ...prev,
                          section: e.target.value,
                        }))
                      }
                      className="filter-select"
                    >
                      <option value="all">All Sections</option>
                      {[
                        ...new Set(
                          leaderboardData.map((p) => p.userSection)
                        ),
                      ]
                        .filter(Boolean)
                        .sort()
                        .map((section) => (
                          <option key={section} value={section}>
                            Section {section}
                          </option>
                        ))}
                    </select>

                    {(participantSearch ||
                      participantFilters.department !== "all" ||
                      participantFilters.year !== "all" ||
                      participantFilters.section !== "all") && (
                      <button
                        className="clear-filters-btn"
                        onClick={() => {
                          setParticipantSearch("");
                          setParticipantFilters({
                            department: "all",
                            year: "all",
                            section: "all",
                          });
                        }}
                      >
                        <Filter className="icon" size={16} />
                        Clear Filters
                      </button>
                    )}
                  </div>

                  <div className="participants-count">
                    Showing {sortedLeaderboardData.length} of{" "}
                    {leaderboardData.length} participants
                  </div>
                </div>
              )}

              <div className="participants-content">
                {isLeaderboardLoading ? (
                  <div className="loading-state">Loading participants...</div>
                ) : leaderboardData.length > 0 ? (
                  sortedLeaderboardData.length > 0 ? (
                    <div className="leaderboard-table-container">
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>S No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Year</th>
                            <th>Section</th>
                            <th>
                              <button
                                onClick={() => requestSort("points")}
                                className="sort-button"
                              >
                                Score{" "}
                                {sortConfig.key === "points"
                                  ? sortConfig.direction === "ascending"
                                    ? "▲"
                                    : "▼"
                                  : "⇅"}
                              </button>
                            </th>
                            <th>
                              <button
                                onClick={() => requestSort("submittedAt")}
                                className="sort-button"
                              >
                                Submitted At{" "}
                                {sortConfig.key === "submittedAt"
                                  ? sortConfig.direction === "ascending"
                                    ? "▲"
                                    : "▼"
                                  : "⇅"}
                              </button>
                            </th>
                            <th>Proctoring</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedLeaderboardData.map((user, index) => (
                            <tr key={user.resultId}>
                              <td className="sno-cell">{index + 1}</td>
                              <td className="name-cell">{user.userName}</td>
                              <td className="email-cell">{user.userEmail}</td>
                              <td>{user.userDepartment}</td>
                              <td>{user.userYear}</td>
                              <td>{user.userSection}</td>
                              <td className="score-cell">
                                <span className="score-badge">{user.points}</span>
                              </td>
                              <td className="date-cell">
                                {new Date(user.submittedAt).toLocaleString()}
                              </td>
                              <td className="actions-cell">
                                <button
                                  className="btn-view-logs"
                                  onClick={() =>
                                    handleViewProctoringLogs(
                                      user.userId,
                                      user.userName,
                                      selectedEventId
                                    )
                                  }
                                  title="View proctoring logs"
                                >
                                  <Eye size={16} />
                                  Logs
                                </button>
                              </td>
                              <td className="actions-cell">
                                <button
                                  className="btn-reopen"
                                  onClick={() =>
                                    handleReopenForUser(
                                      user.userId,
                                      user.userName,
                                      selectedEventId
                                    )
                                  }
                                  title="Reopen contest for this student"
                                >
                                  <Activity size={16} />
                                  Reopen
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No participants match the current filters.</p>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setParticipantSearch("");
                          setParticipantFilters({
                            department: "all",
                            year: "all",
                            section: "all",
                          });
                        }}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )
                ) : (
                  <div className="empty-state">
                    <p>
                      No participants have submitted results for this event yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {sortedLeaderboardData.length > 0 && (
                  <button
                    className="btn-primary"
                    onClick={exportToExcel}
                    style={{ marginRight: "10px" }}
                  >
                    <Download className="icon" />
                    Export to Excel
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={closeLeaderboardModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proctoring Logs Modal */}
        {showProctoringLogsModal && (
          <div className="modal-overlay">
            <div className="modal-content proctoring-logs-modal">
              <div className="modal-header">
                <h3>
                  <AlertTriangle size={20} style={{ marginRight: "8px" }} />
                  Proctoring Logs - {selectedStudentForLogs?.name}
                </h3>
                <button
                  className="close-button"
                  onClick={closeProctoringLogsModal}
                >
                  ×
                </button>
              </div>

              <div className="proctoring-logs-content">
                {isProctoringLogsLoading ? (
                  <div className="loading-state">
                    Loading proctoring logs...
                  </div>
                ) : proctoringLogs && proctoringLogs.violations && proctoringLogs.violations.length > 0 ? (
                  <>
                    {(() => {
                      // Calculate total unique violations across all documents
                      const totalUniqueViolations = proctoringLogs.violations.reduce((total, logDoc) => {
                        const uniqueViolations = logDoc.violations.filter((violation, index, self) =>
                          index === self.findIndex((v) =>
                            v.timestamp === violation.timestamp &&
                            v.type === violation.type &&
                            v.count === violation.count
                          )
                        );
                        return total + uniqueViolations.length;
                      }, 0);

                      return (
                        <div className="logs-summary">
                          <div className="summary-card">
                            <span className="summary-label">Total Violations:</span>
                            <span className="summary-value">
                              {totalUniqueViolations}
                            </span>
                          </div>
                          <div className="summary-card">
                            <span className="summary-label">Student:</span>
                            <span className="summary-value">
                              {selectedStudentForLogs?.name}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {proctoringLogs.violations.map((logDoc, docIndex) => {
                      // Deduplicate violations based on timestamp + type + count
                      const uniqueViolations = logDoc.violations.filter((violation, index, self) =>
                        index === self.findIndex((v) =>
                          v.timestamp === violation.timestamp &&
                          v.type === violation.type &&
                          v.count === violation.count
                        )
                      );

                      return (
                        <div key={docIndex} className="logs-section">
                          <h4 className="logs-section-title">
                            Contest Session (Total: {uniqueViolations.length}{" "}
                            violations)
                          </h4>
                          <div className="violations-list">
                            {uniqueViolations.map((violation, vIndex) => (
                              <div key={vIndex} className="violation-item">
                                <div className="violation-header">
                                  <span className="violation-number">
                                    Violation #{vIndex + 1}
                                  </span>
                                  <span className="violation-time">
                                    {new Date(
                                      violation.timestamp
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="violation-details">
                                  <div className="detail-row">
                                    <span className="detail-label">Type:</span>
                                    <span className="detail-value violation-type">
                                      {violation.type}
                                    </span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">User Agent:</span>
                                    <span
                                      className="detail-value user-agent"
                                      title={violation.userAgent}
                                    >
                                      {violation.userAgent?.substring(0, 50)}...
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="empty-state">
                    <AlertTriangle size={56} style={{ strokeWidth: 2 }} />
                    <p>No proctoring violations found for this student.</p>
                    <p className="empty-subtext">
                      This student completed the contest without any proctoring
                      violations.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={closeProctoringLogsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details View Modal */}
        {showViewModal && selectedEvent && (
          <div className="modal-overlay">
            <div className="modal-content event-details-modal">
              <div className="modal-header">
                <h3>{selectedEvent.eventTitle}</h3>
                <button className="close-button" onClick={closeViewModal}>
                  ×
                </button>
              </div>

              <div className="event-details-content">
                {/* Event Overview */}
                <div className="detail-section">
                  <h4>Event Overview</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">
                        {selectedEvent.eventType?.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mode:</span>
                      <span className="detail-value">
                        {selectedEvent.eventMode?.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">
                        {selectedEvent.durationMinutes} minutes
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        {selectedEvent.active ? "Active" : "Ended"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Topics:</span>
                      <span className="detail-value">
                        {selectedEvent.topicsCovered}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Allowed Departments:</span>
                      <span className="detail-value">
                        {selectedEvent.allowedDepartments || "Any department"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Participants:</span>
                      <span className="detail-value">
                        {typeof selectedEvent.participants === 'number' 
                          ? selectedEvent.participants 
                          : (selectedEvent.participants?.length || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Description */}
                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="event-description">
                    {selectedEvent.eventDescription}
                  </p>
                </div>

                {/* Questions/Problems Section */}
                <div className="detail-section">
                  <h4>
                    {selectedEvent.eventType === "quiz"
                      ? "Questions"
                      : "Problems"}
                  </h4>

                  {selectedEvent.eventType === "quiz" ? (
                    // Quiz Questions
                    <div className="questions-list">
                      {selectedEvent.questions?.map((question, index) => (
                        <div
                          key={question.questionId}
                          className="question-item"
                        >
                          <div className="question-header">
                            <span className="question-number">
                              Q{index + 1}
                            </span>
                            <span className="question-points">
                              {selectedEvent.pointsPerQuestion} points
                            </span>
                          </div>
                          <p className="question-text">{question.question}</p>
                          <div className="options-list">
                            {question.options?.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`option-item ${
                                  option === question.correctAnswer
                                    ? "correct"
                                    : ""
                                }`}
                              >
                                <span className="option-label">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span className="option-text">{option}</span>
                                {option === question.correctAnswer && (
                                  <span className="correct-badge">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Coding Contest Problems
                    <div className="problems-list">
                      {selectedEvent.problems?.map((problem, index) => (
                        <div key={problem.questionId} className="problem-item">
                          <div className="problem-header">
                            <span className="problem-code">
                              {problem.contestProblemCode}
                            </span>
                            <span className="problem-points">
                              {problem.points} points
                            </span>
                          </div>
                          <h5 className="problem-title">{problem.title}</h5>
                          <p className="problem-description">
                            {problem.description}
                          </p>

                          {/* Input/Output Format */}
                          <div className="problem-details">
                            <div className="io-section">
                              <h6>Input Format</h6>
                              <p>{problem.problemDetails?.inputFormat}</p>
                            </div>
                            <div className="io-section">
                              <h6>Output Format</h6>
                              <p>{problem.problemDetails?.outputFormat}</p>
                            </div>
                          </div>

                          {/* Example */}
                          {problem.examples?.length > 0 && (
                            <div className="example-section">
                              <h6>Example</h6>
                              <div className="example-grid">
                                <div className="example-input">
                                  <span className="example-label">Input:</span>
                                  <pre>{problem.examples[0].input}</pre>
                                </div>
                                <div className="example-output">
                                  <span className="example-label">Output:</span>
                                  <pre>{problem.examples[0].output}</pre>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Starter Code */}
                          <div className="starter-code-section">
                            <h6>Starter Code</h6>
                            <div className="code-tabs">
                              <div className="code-tab">
                                <span className="tab-label">Python</span>
                                <pre className="code-block">
                                  {problem.starterCode?.python}
                                </pre>
                              </div>
                              <div className="code-tab">
                                <span className="tab-label">Java</span>
                                <pre className="code-block">
                                  {problem.starterCode?.java}
                                </pre>
                              </div>
                            </div>
                          </div>

                          {/* Test Cases */}
                          <div className="test-cases-section">
                            <h6>
                              Test Cases ({problem.testCases?.length || 0})
                            </h6>
                            <div className="test-cases-list">
                              {problem.testCases?.map((testCase, tcIndex) => (
                                <div
                                  key={testCase.testCaseId}
                                  className="test-case-item"
                                >
                                  <div className="test-case-header">
                                    <span className="test-case-number">
                                      Test Case {tcIndex + 1}
                                    </span>
                                    <span className="test-case-hidden">
                                      Hidden
                                    </span>
                                  </div>
                                  <div className="test-case-content">
                                    <div className="test-input">
                                      <span className="test-label">Input:</span>
                                      <pre>{testCase.input}</pre>
                                    </div>
                                    <div className="test-output">
                                      <span className="test-label">
                                        Expected Output:
                                      </span>
                                      <pre>{testCase.expectedOutput}</pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeViewModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Event Modal */}
        {showStartModal && editingEvent && (
          <div className="modal-overlay">
            <div className="modal-content start-event-modal">
              <div className="modal-header">
                <h3>Start Event: {editingEvent.eventTitle}</h3>
                <button className="close-button" onClick={cancelStartEvent}>
                  ×
                </button>
              </div>

              <div className="start-event-content">
                <p className="start-event-description">
                  Review and edit the event details before starting. Once
                  started, the event will be active and participants can join.
                </p>

                <div className="edit-form">
                  <div className="form-group">
                    <p>Event Title</p>
                    <input
                      type="text"
                      value={editFormData.eventTitle || ""}
                      onChange={(e) =>
                        handleEditFormChange("eventTitle", e.target.value)
                      }
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="form-group">
                    <p>Event Description</p>
                    <textarea
                      value={editFormData.eventDescription || ""}
                      onChange={(e) =>
                        handleEditFormChange("eventDescription", e.target.value)
                      }
                      placeholder="Enter event description"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <p>Duration (minutes)</p>
                      <input
                        type="number"
                        value={editFormData.durationMinutes || ""}
                        onChange={(e) =>
                          handleEditFormChange(
                            "durationMinutes",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="Duration in minutes"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <p>Event Mode</p>
                      <select
                        value={editFormData.eventMode || ""}
                        onChange={(e) =>
                          handleEditFormChange("eventMode", e.target.value)
                        }
                      >
                        <option value="practice">Practice Mode</option>
                        <option value="strict">Strict Mode</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <p>Topics Covered</p>
                    <input
                      type="text"
                      value={editFormData.topicsCovered || ""}
                      onChange={(e) =>
                        handleEditFormChange("topicsCovered", e.target.value)
                      }
                      placeholder="e.g., Algorithms, Data Structures, Web Development"
                    />
                  </div>

                  <div className="form-group">
                    <p>Allowed Departments</p>
                    <select
                      value={editFormData.allowedDepartments || ""}
                      onChange={(e) =>
                        handleEditFormChange(
                          "allowedDepartments",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select Departments</option>
                      <option value="Any department">Any department</option>
                      <option value="CSE">CSE</option>
                      <option value="EEE">EEE</option>
                      <option value="ECE">ECE</option>
                      <option value="IT">IT</option>
                      <option value="CSD">CSD</option>
                    </select>
                  </div>
                </div>

                {/* Quiz Questions Section */}
                {editingEvent.eventType === "quiz" &&
                  editFormData.questions && (
                    <div className="questions-edit-section">
                      <h4>Quiz Questions</h4>
                      <div className="questions-list">
                        {editFormData.questions.map((question, qIndex) => (
                          <div
                            key={question.questionId}
                            className="question-edit-item"
                          >
                            <div className="question-header">
                              <span className="question-number">
                                Question {qIndex + 1}
                              </span>
                              <span className="question-points">
                                {editingEvent.pointsPerQuestion} points
                              </span>
                            </div>

                            <div className="form-group">
                              <p>Question Text</p>
                              <textarea
                                value={question.question || ""}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    qIndex,
                                    "question",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter the question text"
                                rows="3"
                              />
                            </div>

                            <div className="options-section">
                              <p>Options</p>
                              <div className="options-list">
                                {question.options?.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="option-edit-item"
                                  >
                                    <span className="option-label">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    <input
                                      type="text"
                                      value={option || ""}
                                      onChange={(e) =>
                                        handleOptionChange(
                                          qIndex,
                                          optIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Option ${String.fromCharCode(
                                        65 + optIndex
                                      )}`}
                                      className={
                                        option === question.correctAnswer
                                          ? "correct-option"
                                          : ""
                                      }
                                    />
                                    <input
                                      type="radio"
                                      name={`correct-${qIndex}`}
                                      checked={
                                        option === question.correctAnswer
                                      }
                                      onChange={() =>
                                        handleQuestionChange(
                                          qIndex,
                                          "correctAnswer",
                                          option
                                        )
                                      }
                                      className="correct-radio"
                                    />
                                    <span className="correct-label">
                                      Correct
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Coding Contest Problems Section */}
                {editingEvent.eventType === "contest" &&
                  editFormData.problems && (
                    <div className="problems-edit-section">
                      <h4>Coding Problems</h4>
                      <div className="problems-list">
                        {editFormData.problems.map((problem, pIndex) => (
                          <div
                            key={problem.questionId}
                            className="problem-edit-item"
                          >
                            <div className="problem-header">
                              <span className="problem-code">
                                {problem.contestProblemCode}
                              </span>
                              <span className="problem-points">
                                {problem.points} points
                              </span>
                            </div>

                            <div className="form-group">
                              <p>Problem Title</p>
                              <input
                                type="text"
                                value={problem.title || ""}
                                onChange={(e) =>
                                  handleProblemChange(
                                    pIndex,
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter problem title"
                              />
                            </div>

                            <div className="form-group">
                              <p>Problem Description</p>
                              <textarea
                                value={problem.description || ""}
                                onChange={(e) =>
                                  handleProblemChange(
                                    pIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter problem description"
                                rows="4"
                              />
                            </div>

                            <div className="form-row">
                              <div className="form-group">
                                <p>Input Format</p>
                                <textarea
                                  value={
                                    problem.problemDetails?.inputFormat || ""
                                  }
                                  onChange={(e) =>
                                    handleProblemDetailChange(
                                      pIndex,
                                      "inputFormat",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Describe the input format"
                                  rows="3"
                                />
                              </div>
                              <div className="form-group">
                                <p>Output Format</p>
                                <textarea
                                  value={
                                    problem.problemDetails?.outputFormat || ""
                                  }
                                  onChange={(e) =>
                                    handleProblemDetailChange(
                                      pIndex,
                                      "outputFormat",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Describe the output format"
                                  rows="3"
                                />
                              </div>
                            </div>

                            <div className="example-section">
                              <p>Example</p>
                              <div className="form-row">
                                <div className="form-group">
                                  <p>Input</p>
                                  <textarea
                                    value={problem.examples?.[0]?.input || ""}
                                    onChange={(e) =>
                                      handleExampleChange(
                                        pIndex,
                                        "input",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Example input"
                                    rows="3"
                                  />
                                </div>
                                <div className="form-group">
                                  <p>Output</p>
                                  <textarea
                                    value={problem.examples?.[0]?.output || ""}
                                    onChange={(e) =>
                                      handleExampleChange(
                                        pIndex,
                                        "output",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Example output"
                                    rows="3"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="starter-code-section">
                              <p>Starter Code</p>
                              <div className="code-tabs">
                                <div className="code-tab">
                                  <p>Python</p>
                                  <textarea
                                    value={problem.starterCode?.python || ""}
                                    onChange={(e) =>
                                      handleStarterCodeChange(
                                        pIndex,
                                        "python",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Python starter code"
                                    rows="6"
                                    className="code-textarea"
                                  />
                                </div>
                                <div className="code-tab">
                                  <p>Java</p>
                                  <textarea
                                    value={problem.starterCode?.java || ""}
                                    onChange={(e) =>
                                      handleStarterCodeChange(
                                        pIndex,
                                        "java",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Java starter code"
                                    rows="6"
                                    className="code-textarea"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="test-cases-section">
                              <p>Test Cases</p>
                              <div className="test-cases-list">
                                {problem.testCases?.map((testCase, tcIndex) => (
                                  <div
                                    key={testCase.testCaseId}
                                    className="test-case-edit-item"
                                  >
                                    <div className="test-case-header">
                                      <span className="test-case-number">
                                        Test Case {tcIndex + 1}
                                      </span>
                                      <span className="test-case-hidden">
                                        Hidden
                                      </span>
                                    </div>
                                    <div className="form-row">
                                      <div className="form-group">
                                        <p>Input</p>
                                        <textarea
                                          value={testCase.input || ""}
                                          onChange={(e) =>
                                            handleTestCaseChange(
                                              pIndex,
                                              tcIndex,
                                              "input",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Test case input"
                                          rows="3"
                                        />
                                      </div>
                                      <div className="form-group">
                                        <p>Expected Output</p>
                                        <textarea
                                          value={testCase.expectedOutput || ""}
                                          onChange={(e) =>
                                            handleTestCaseChange(
                                              pIndex,
                                              tcIndex,
                                              "expectedOutput",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Expected output"
                                          rows="3"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="event-summary">
                  <h4>Event Summary</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Type:</span>
                      <span className="summary-value">
                        {editingEvent.eventType?.toUpperCase()}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">
                        Allowed Departments:
                      </span>
                      <span className="summary-value">
                        {editFormData.allowedDepartments ||
                          editingEvent.allowedDepartments ||
                          "Any department"}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Questions/Problems:</span>
                      <span className="summary-value">
                        {editingEvent.eventType === "quiz"
                          ? editingEvent.numberOfQuestions
                          : editingEvent.numberOfPrograms}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">
                        Points per Question:
                      </span>
                      <span className="summary-value">
                        {editingEvent.eventType === "quiz"
                          ? editingEvent.pointsPerQuestion
                          : editingEvent.pointsPerProgram}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Score:</span>
                      <span className="summary-value">
                        {editingEvent.eventType === "quiz"
                          ? editingEvent.totalScore
                          : editingEvent.numberOfPrograms *
                            editingEvent.pointsPerProgram}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={cancelStartEvent}
                  disabled={startEventLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-success"
                  onClick={confirmStartEvent}
                  disabled={startEventLoading}
                >
                  {startEventLoading ? (
                    <>
                      <div className="spinner"></div>
                      Starting Event...
                    </>
                  ) : (
                    "Start Event"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageContest;
