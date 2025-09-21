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
    { id: "analytics", label: "Analytics", icon: TrendingUp },
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

      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }

      const data = await response.json();
      setSelectedEvent(data.event);
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
  };

  const sortedLeaderboardData = useMemo(() => {
    let sortableItems = [...leaderboardData];
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
  }, [leaderboardData, sortConfig]);

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
        Rank: index + 1,
        Name: user.userName,
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
        { wch: 6 },  // Rank
        { wch: 20 }, // Name
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
                                📋
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

        {/* Leaderboard / Participants Modal */}
        {showLeaderboardModal && (
          <div className="modal-overlay">
            <div className="modal-content event-details-modal">
              <div className="modal-header">
                <h3>Participants for: {selectedEvent?.eventTitle}</h3>
                <button
                  className="close-button"
                  onClick={closeLeaderboardModal}
                >
                  ×
                </button>
              </div>

              <div className="participants-content">
                {isLeaderboardLoading ? (
                  <div className="loading-state">Loading participants...</div>
                ) : sortedLeaderboardData.length > 0 ? (
                  <div className="leaderboard-table-container">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          {/* Clickable Table Headers for Sorting */}
                          <th>S/N</th>
                          <th>
                            <button
                              onClick={() => requestSort("userName")}
                              className="sort-button"
                            >
                              Name{" "}
                              {sortConfig.key === "userName"
                                ? sortConfig.direction === "ascending"
                                  ? "▲"
                                  : "▼"
                                : ""}
                            </button>
                          </th>
                          <th>
                            <button
                              onClick={() => requestSort("userDepartment")}
                              className="sort-button"
                            >
                              Department{" "}
                              {sortConfig.key === "userDepartment"
                                ? sortConfig.direction === "ascending"
                                  ? "▲"
                                  : "▼"
                                : ""}
                            </button>
                          </th>
                          <th>
                            <button
                              onClick={() => requestSort("userYear")}
                              className="sort-button"
                            >
                              Year{" "}
                              {sortConfig.key === "userYear"
                                ? sortConfig.direction === "ascending"
                                  ? "▲"
                                  : "▼"
                                : ""}
                            </button>
                          </th>
                          <th>
                            <button
                              onClick={() => requestSort("userSection")}
                              className="sort-button"
                            >
                              Section{" "}
                              {sortConfig.key === "userSection"
                                ? sortConfig.direction === "ascending"
                                  ? "▲"
                                  : "▼"
                                : ""}
                            </button>
                          </th>
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
                                : ""}
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
                                : ""}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLeaderboardData.map((user, index) => (
                          <tr key={user.resultId}>
                            <td>{index + 1}</td>
                            <td>{user.userName}</td>
                            <td>{user.userDepartment}</td>
                            <td>{user.userYear}</td>
                            <td>{user.userSection}</td>
                            <td>{user.points}</td>
                            <td>
                              {new Date(user.submittedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                        {selectedEvent.participants?.length || 0}
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
