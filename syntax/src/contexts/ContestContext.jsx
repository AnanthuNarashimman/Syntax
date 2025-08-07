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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [adminNameLoading, setAdminNameLoading] = useState(true);

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
      eventMode: backendEvent.eventMode, // <-- Add this line
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

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, []);

  const value = {
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
    adminNameLoading
  };

  return (
    <ContestContext.Provider value={value}>
      {children}
    </ContestContext.Provider>
  );
}; 