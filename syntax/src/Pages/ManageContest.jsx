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
} from "lucide-react";
import { useState, useEffect } from "react";
import AdminNavbar from "../Components/AdminNavbar";
import "../Styles/PageStyles/ManageContest.css";
import { useNavigate } from "react-router-dom";

function ManageContest() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contests, setContests] = useState([]); // State to store fetched contests
  const [loading, setLoading] = useState(true); // State for loading status
  const [error, setError] = useState(null); // State for error messages

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

  // Helper function to transform backend contest data to frontend display format
  const transformContestData = (backendContest) => {
    const now = new Date();
    // Ensure createdAt is a Date object. It might be a Firestore Timestamp or a plain object from JSON.
    const createdAt =
      backendContest.createdAt &&
      typeof backendContest.createdAt.toDate === "function"
        ? backendContest.createdAt.toDate() // Firestore Timestamp
        : backendContest.createdAt
        ? new Date(
            backendContest.createdAt._seconds * 1000 +
              backendContest.createdAt._nanoseconds / 1000000
          )
        : new Date(); // Fallback for plain object or missing

    const durationMs = backendContest.durationMinutes * 60 * 1000;
    const endTime = new Date(createdAt.getTime() + durationMs);

    let status = "upcoming"; // Default status for non-published or future published
    let timeLeft = "";
    let mode = "usual"; // Default mode

    // Determine status based on 'status' field from backend and time
    if (backendContest.status === "published") {
      if (now >= createdAt && now < endTime) {
        status = "ongoing"; // Live
        const remainingMs = endTime.getTime() - now.getTime();
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        timeLeft = `${hours}h ${minutes}m left`;
        mode = "strict"; // Assuming live published contests are strict mode
      } else if (now >= endTime) {
        status = "ended"; // Past
        timeLeft = "Ended";
      } else {
        // Published but not yet started
        status = "upcoming";
        const startsInMs = createdAt.getTime() - now.getTime();
        const days = Math.floor(startsInMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (startsInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        timeLeft = `Starts in ${days}d ${hours}h`;
      }
    } else if (backendContest.status === "draft") {
      status = "upcoming"; // Draft contests are treated as upcoming for display
      timeLeft = "Not Published";
    }

    // Determine type based on contestType from backend
    let type = "contest"; // Default to 'contest'
    if (backendContest.contestType) {
      const backendTypeLower = backendContest.contestType.toLowerCase();
      if (backendTypeLower.includes("quiz")) {
        type = "quiz";
      } else if (backendTypeLower.includes("practice")) {
        type = "practice";
      } else {
        // If it's not explicitly 'quiz' or 'practice', assume it's a general 'contest'
        type = "contest";
      }
    }

    return {
      id: backendContest.id,
      title: backendContest.contestTitle,
      description: backendContest.contestDescription,
      mode: mode,
      status: status,
      participants: backendContest.participants
        ? backendContest.participants.length
        : 0,
      timeLeft: timeLeft,
      type: type,
    };
  };

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        setError(null); 

        const response = await fetch("/api/admin/contests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", 
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch contests");
        }

        const data = await response.json();
        const transformedContests = data.contests.map(transformContestData);
        setContests(transformedContests);
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []); 

  const filteredContests = contests.filter((contest) => {
    const matchesSearch = contest.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || contest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      ongoing: { text: "LIVE", className: "live" },
      upcoming: { text: "SCHEDULED", className: "scheduled" },
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
      practice: <BookOpen className="type-icon" />,
    };
    return icons[type] || <Trophy className="type-icon" />;
  };

  const groupedContests = {
    contest: filteredContests.filter((c) => c.type === "contest"),
    quiz: filteredContests.filter((c) => c.type === "quiz"),
    practice: filteredContests.filter((c) => c.type === "practice"),
  };

  return (
    <>
      <AdminNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebarItems={sidebarItems}
      />
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
                className={statusFilter === "ongoing" ? "active" : ""}
                onClick={() => setStatusFilter("ongoing")}
              >
                Ongoing
              </button>
              <button
                className={statusFilter === "upcoming" ? "active" : ""}
                onClick={() => setStatusFilter("upcoming")}
              >
                Upcoming
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
            {Object.entries(groupedContests).map(
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
                                {item.mode === "strict"
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
                            <div className="participants">
                              <Users className="icon" />
                              <span>{item.participants} participants</span>
                            </div>
                            <div className="time-info">
                              <Clock className="icon" />
                              <span>{item.timeLeft}</span>
                            </div>
                          </div>

                          <div className="card-actions">
                            <button className="btn-secondary">Edit</button>
                            <button className="btn-primary">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}

        {!loading && !error && filteredContests.length === 0 && (
          <div className="empty-state">
            <p>No contests found matching your criteria.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageContest;
