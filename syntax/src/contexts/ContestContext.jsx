import React, { createContext, useContext, useState, useEffect } from 'react';

const ContestContext = createContext();

export const useContestContext = () => {
  const context = useContext(ContestContext);
  if (!context) {
    throw new Error('useContestContext must be used within a ContestProvider');
  }
  return context;
};

export const ContestProvider = ({ children }) => {
  // Admin-specific state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [adminNameLoading, setAdminNameLoading] = useState(true);

  // Student-specific state
  const [studentContests, setStudentContests] = useState([]);
  const [studentArticles, setStudentArticles] = useState([]);
  const [studentContestsLoading, setStudentContestsLoading] = useState(true);
  const [studentArticlesLoading, setStudentArticlesLoading] = useState(true);
  const [studentContestsError, setStudentContestsError] = useState(null);
  const [studentArticlesError, setStudentArticlesError] = useState(null);
  const [isStudentAuthenticated, setIsStudentAuthenticated] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Student submissions state
  const [studentSubmissions, setStudentSubmissions] = useState({
    totalPoints: 0,
    contestsParticipated: 0
  });
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState(null);

  // Fetch current admin's name
  useEffect(() => {
    const fetchAdminName = async () => {
      try {
        setAdminNameLoading(true);
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setAdminName(data.userName || 'Admin');
        } else {
          setAdminName('Admin');
        }
      } catch (err) {
        setAdminName('Admin');
      } finally {
        setAdminNameLoading(false);
      }
    };
    fetchAdminName();
  }, []);

  // Fetch events from the backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/events", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Check student authentication status
  const checkStudentAuth = async () => {
    try {
      const response = await fetch('/api/user/student-profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        setIsStudentAuthenticated(true);
        return true;
      } else {
        setIsStudentAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Student auth check failed:', error);
      setIsStudentAuthenticated(false);
      return false;
    } finally {
      setAuthCheckComplete(true);
    }
  };

  // Fetch student contests from the backend with retry logic
  const fetchStudentContests = async (retryCount = 0) => {
    try {
      setStudentContestsLoading(true);
      setStudentContestsError(null);

      const response = await fetch('/api/student/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 403 && retryCount < 2) {
        // Wait a bit and retry for 403 errors (authentication timing issues)
        console.log(`403 error, retrying... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchStudentContests(retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.events) {
        setStudentContests(data.events);
      } else {
        setStudentContests([]);
      }
    } catch (error) {
      console.error('Error fetching student contests:', error);
      setStudentContestsError(error.message);
      setStudentContests([]);
    } finally {
      setStudentContestsLoading(false);
    }
  };

  // Fetch student articles from the backend with retry logic
  const fetchStudentArticles = async (retryCount = 0) => {
    try {
      setStudentArticlesLoading(true);
      setStudentArticlesError(null);

      const response = await fetch('/api/student/articles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 403 && retryCount < 2) {
        // Wait a bit and retry for 403 errors (authentication timing issues)
        console.log(`403 error, retrying... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchStudentArticles(retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.articles) {
        setStudentArticles(data.articles);
      } else {
        setStudentArticles([]);
      }
    } catch (error) {
      console.error('Error fetching student articles:', error);
      setStudentArticlesError(error.message);
      setStudentArticles([]);
    } finally {
      setStudentArticlesLoading(false);
    }
  };

  // Fetch student submissions data
  const fetchStudentSubmissions = async (retryCount = 0) => {
    try {
      setSubmissionsLoading(true);
      setSubmissionsError(null);

      const response = await fetch('/api/student/profile/submissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 403 && retryCount < 2) {
        console.log('Student submissions fetch: Authentication failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchStudentSubmissions(retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`);
      }

      const data = await response.json();

      setStudentSubmissions({
        totalPoints: data.Points || 0,
        contestsParticipated: data.Count || 0
      });
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      setSubmissionsError(error.message);
      setStudentSubmissions({
        totalPoints: 0,
        contestsParticipated: 0
      });
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Transform backend event data to frontend display format
  const transformEventData = (backendEvent) => {
    const now = new Date();
    const createdAt =
      backendEvent.createdAt &&
      typeof backendEvent.createdAt.toDate === "function"
        ? backendEvent.createdAt.toDate()
        : backendEvent.createdAt
        ? new Date(
            backendEvent.createdAt._seconds * 1000 +
              backendEvent.createdAt._nanoseconds / 1000000
          )
        : new Date();

    let status = "queue";
    let timeLeft = "";
    let mode = "usual";

    if (backendEvent.status === "active") {
      status = "ongoing";
      timeLeft = "Active";
      mode = backendEvent.eventMode === "strict" ? "strict" : "practice";
    } else if (backendEvent.status === "ended") {
      status = "ended";
      timeLeft = "Ended";
    } else if (backendEvent.status === "queue") {
      status = "queue";
      timeLeft = "In Queue";
    }

    let type = "contest";
    if (backendEvent.eventType) {
      const backendTypeLower = backendEvent.eventType.toLowerCase();
      if (backendTypeLower.includes("quiz")) {
        type = "quiz";
      } else {
        type = "contest";
      }
    }

    return {
      id: backendEvent.id,
      title: backendEvent.eventTitle,
      description: backendEvent.eventDescription,
      mode: backendEvent.eventMode === "strict" ? "strict" : "practice",
      eventMode: backendEvent.eventMode, 
      status: status,
      participants: backendEvent.participants ? backendEvent.participants.length : 0,
      timeLeft: timeLeft,
      type: type,
      backendStatus: backendEvent.status,
      createdAt: createdAt,
      durationMinutes: backendEvent.durationMinutes,
      pointsPerQuestion: backendEvent.pointsPerQuestion || backendEvent.pointsPerProgram,
      numberOfQuestions: backendEvent.numberOfQuestions || backendEvent.numberOfPrograms,
    };
  };

  // Get categorized events
  const getCategorizedEvents = () => {
    const transformedEvents = events.map(transformEventData);
    
    return {
      active: transformedEvents.filter(event => event.status === "ongoing"),
      queue: transformedEvents.filter(event => event.status === "queue"),
      ended: transformedEvents.filter(event => event.status === "ended"),
      all: transformedEvents
    };
  };

  // Get recent contests (3 latest created)
  const getRecentContests = () => {
    const transformedEvents = events.map(transformEventData);
    return transformedEvents
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  // Get stats
  const getStats = () => {
    const categorized = getCategorizedEvents();
    return {
      activeContests: categorized.active.length,
      totalParticipants: categorized.all.reduce((sum, event) => sum + event.participants, 0),
      completedEvents: categorized.ended.length
    };
  };

  // Update event status
  const updateEventStatus = async (eventId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }

      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, status: newStatus }
            : event
        )
      );

      return true;
    } catch (err) {
      throw new Error(`Error updating event: ${err.message}`);
    }
  };

  // Update event data
  const updateEventData = async (eventId, updateData) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }

      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, ...updateData }
            : event
        )
      );

      return true;
    } catch (err) {
      throw new Error(`Error updating event: ${err.message}`);
    }
  };

  // Add new event to local state (for when a new contest is created)
  const addNewEvent = (newEvent) => {
    setEvents(prevEvents => [newEvent, ...prevEvents]);
  };

  // Get recent student contests (3 latest for home page)
  const getRecentStudentContests = () => {
    return studentContests
      .sort((a, b) => {
        const dateA = a.createdAt?._seconds || 0;
        const dateB = b.createdAt?._seconds || 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  };

  // Helper function to format date for student data
  const formatStudentDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get contest status badge
  const getStudentContestStatus = (status) => {
    const statusMap = {
      'active': { label: 'Active', color: '#10b981' },
      'upcoming': { label: 'Upcoming', color: '#3b82f6' },
      'ended': { label: 'Ended', color: '#6b7280' },
      'draft': { label: 'Draft', color: '#f59e0b' }
    };
    return statusMap[status] || { label: status, color: '#6b7280' };
  };

  // Initial fetch for admin events
  useEffect(() => {
    fetchEvents();
  }, []);

  // Initial fetch for student data with small delay to ensure authentication is ready
  useEffect(() => {
    const initializeStudentData = async () => {
      // Small delay to ensure authentication cookie is properly set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check authentication first
      const isAuth = await checkStudentAuth();

      if (isAuth) {
        // If authenticated, fetch data
        fetchStudentContests();
        fetchStudentArticles();
        fetchStudentSubmissions();
      } else {
        // If not authenticated, try fetching anyway (will handle 403 with retry)
        fetchStudentContests();
        fetchStudentArticles();
        fetchStudentSubmissions();
      }
    };

    initializeStudentData();
  }, []);

  const value = {
    // Admin data
    events,
    loading,
    error,
    fetchEvents,
    getCategorizedEvents,
    getRecentContests,
    getStats,
    updateEventStatus,
    updateEventData,
    addNewEvent,
    transformEventData,
    adminName,
    adminNameLoading,

    // Student data
    studentContests,
    studentArticles,
    studentContestsLoading,
    studentArticlesLoading,
    studentContestsError,
    studentArticlesError,
    fetchStudentContests,
    fetchStudentArticles,
    getRecentStudentContests,
    formatStudentDate,
    getStudentContestStatus,
    isStudentAuthenticated,
    authCheckComplete,
    checkStudentAuth,

    // Student submissions data
    studentSubmissions,
    submissionsLoading,
    submissionsError,
    fetchStudentSubmissions
  };

  return (
    <ContestContext.Provider value={value}>
      {children}
    </ContestContext.Provider>
  );
}; 