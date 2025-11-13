import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Trophy,
  Target,
  TrendingUp,
  Edit3,
  Settings,
  BookOpen,
  Code,
  Star,
  Activity,
  Award
} from "lucide-react";
import styles from "../Styles/PageStyles/StudentUser.module.css";
import StudentNavbar from "../Components/StudentNavbar";
import Loader from "../Components/Loader";
import { useAlert } from "../contexts/AlertContext";
import { useContestContext } from "../contexts/ContestContext";
import SkillEditModal from "../Components/SkillEditModal";
import SettingsModal from "../Components/SettingsModal";

const getInitial = (name) =>
  name && name.length > 0 ? name[0].toUpperCase() : "?";

const StudentUser = () => {
  const { showError } = useAlert();
  const { 
    studentSubmissions, 
    submissionsLoading, 
    submissionsError, 
    fetchStudentSubmissions 
  } = useContestContext();

  const [performanceData, setPerformanceData] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [contestsYAxisDomain, setContestsYAxisDomain] = useState([0, 10]);
  const [scoresYAxisDomain, setScoresYAxisDomain] = useState([0, 100]);

  useEffect(() => {
    fetchStudentSubmissions();
  }, []);

  // Helper function to calculate proper Y-axis intervals
  const calculateYAxisDomain = (maxValue, minInterval = 5) => {
    if (maxValue === 0) return [0, minInterval];
    
    // Calculate a nice interval
    const rawInterval = maxValue / 5; // Aim for about 5 intervals
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const normalizedInterval = rawInterval / magnitude;
    
    let niceInterval;
    if (normalizedInterval <= 1) niceInterval = 1;
    else if (normalizedInterval <= 2) niceInterval = 2;
    else if (normalizedInterval <= 5) niceInterval = 5;
    else niceInterval = 10;
    
    const interval = niceInterval * magnitude;
    const max = Math.ceil(maxValue / interval) * interval;
    
    return [0, Math.max(max, minInterval)];
  };

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch('/api/student/profile/progress', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Performance data received:', data);
          
          // Transform the data for the chart
          const chartData = data.Result.map(item => ({
            date: item.month,
            contests: item.contestsParticipated,
            totalScore: item.totalScore
          }));
          
          // Calculate separate Y-axis domains for each metric
          const maxContests = Math.max(...chartData.map(item => item.contests));
          const maxScore = Math.max(...chartData.map(item => item.totalScore));
          
          setContestsYAxisDomain(calculateYAxisDomain(maxContests, 5));
          setScoresYAxisDomain(calculateYAxisDomain(maxScore, 50));
          
          setPerformanceData(chartData);
        } else {
          console.error('Failed to fetch performance data');
          // Use fallback data for current year months if API fails
          setPerformanceData(generateEmptyYearData());
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setPerformanceData(generateEmptyYearData());
      } finally {
        setPerformanceLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  // Helper function to generate empty data for all 12 months
  const generateEmptyYearData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map(month => ({
      date: month,
      contests: 0,
      totalScore: 0
    }));
  };

  // Debug logging
  useEffect(() => {
    console.log('StudentUser - Submissions state:', {
      submissionsLoading,
      submissionsError,
      studentSubmissions
    });
  }, [submissionsLoading, submissionsError, studentSubmissions]);
  
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [studentData, setStudentData] = useState({
    userName: "User",
    email: "",
    department: "",
    year: "",
    section: "",
    semester: "",
    batch: "",
    contestsParticipated: 0,
    totalScore: 0,
    joinDate: "",
    lastActive: "Recently",
  });

  const [languages, setLanguages] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const res = await fetch("/api/student/profile", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch student profile");

        const data = await res.json();

        setStudentData(data.profile);
        setLanguages(data.profile.languages || []);
        setSkillsData(data.profile.skills || []);
        setProfileLoaded(true);
      } catch (error) {
        console.error(error);
        showError("Failed to load student profile");
        setProfileLoaded(true);
      } finally {
        // Don't set loading to false here - wait for submissions data too
      }
    };

    fetchStudentProfile();
  }, [showError]);

  // Update studentData when submissions data is loaded
  useEffect(() => {
    if (!submissionsLoading && !submissionsError && studentSubmissions) {
      console.log('Updating student data with submissions:', studentSubmissions);
      setStudentData(prevData => ({
        ...prevData,
        contestsParticipated: studentSubmissions.contestsParticipated || 0,
        totalScore: studentSubmissions.totalPoints || 0
      }));
    }
  }, [submissionsLoading, studentSubmissions, submissionsError]);

  // Fallback: manually fetch submissions if context data is not available after profile loads
  useEffect(() => {
    if (profileLoaded && submissionsLoading) {
      const fetchSubmissionsDirectly = async () => {
        try {
          console.log('Fetching submissions directly as fallback...');
          const response = await fetch('/api/student/profile/submissions', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Direct submissions fetch result:', data);
            setStudentData(prevData => ({
              ...prevData,
              contestsParticipated: data.Count || 0,
              totalScore: data.Points || 0
            }));
          }
        } catch (error) {
          console.error('Error fetching submissions directly:', error);
        }
      };

      // Wait a bit for context to load, then fetch directly if needed
      const timer = setTimeout(fetchSubmissionsDirectly, 2000);
      return () => clearTimeout(timer);
    }
  }, [profileLoaded, submissionsLoading]);

  // Set loading to false when profile is loaded (don't wait for submissions)
  useEffect(() => {
    if (profileLoaded && !performanceLoading) {
      setLoading(false);
    }
  }, [profileLoaded, performanceLoading]);

  const handleSaveSkills = async ({ languages, skills }) => {
    try {
      const res = await fetch("/api/student/profile/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ languages, skills }),
      });

      if (!res.ok) throw new Error("Failed to save skills");

      const data = await res.json();

      setLanguages(data.profile.languages || []);
      setSkillsData(data.profile.skills || []);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showError("Failed to save skills");
    }
  };

  // Show loading only if profile hasn't loaded yet
  if (!profileLoaded) {
    return (
      <div className={styles.studentProfile}>
        <StudentNavbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.studentProfile}>
      <StudentNavbar />
      <div className={styles.profileContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
              {getInitial(studentData.userName)}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{studentData.userName}</h2>
              <p className={styles.profileEmail}>{studentData.email}</p>
              <div className={styles.profileBadge}>
                <Star size={16} />
                <span>Active Student</span>
              </div>
            </div>
          </div>

          <div className={styles.profileDetails}>
            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>Academic Info</h3>
              <div className={styles.detailItem}>
                <MapPin size={16} />
                <span className={styles.detailLabel}>Department:</span>
                <span className={styles.detailValue}>
                  {studentData.department}
                </span>
              </div>
              <div className={styles.detailItem}>
                <Calendar size={16} />
                <span className={styles.detailLabel}>Year:</span>
                <span className={styles.detailValue}>{studentData.year}</span>
              </div>
              <div className={styles.detailItem}>
                <User size={16} />
                <span className={styles.detailLabel}>Section:</span>
                <span className={styles.detailValue}>
                  {studentData.section}
                </span>
              </div>
              <div className={styles.detailItem}>
                <BookOpen size={16} />
                <span className={styles.detailLabel}>Batch:</span>
                <span className={styles.detailValue}>{studentData.batch}</span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>Programming Languages</h3>
              <div className={styles.languageTags}>
                {languages.length > 0 ? (
                  languages.map((lang, index) => (
                    <span key={index} className={styles.languageTag}>
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className={styles.noLanguages}>
                    No languages added yet
                  </span>
                )}
              </div>
            </div>

            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>Skills</h3>
              <div className={styles.skillsList}>
                {skillsData.map((skill, index) => (
                  <div key={index} className={styles.skillItem}>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>{skill.skill}</span>
                      <span className={styles.skillLevel}>{skill.level}%</span>
                    </div>
                    <div className={styles.skillBar}>
                      <div
                        className={styles.skillProgress}
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className={styles.editSkillsButton}
            >
              <Edit3 size={16} />
              Edit Skills & Languages
            </button>

            {isModalOpen && (
              <SkillEditModal
                initialLanguages={languages}
                initialSkills={skillsData}
                onSave={handleSaveSkills}
                onClose={() => setIsModalOpen(false)}
              />
            )}

            <div className={styles.profileActions}>
              <button
                className={styles.editButton}
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
              <button className={styles.settingsButton}>
                <Settings size={16} />
                Settings
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header Section */}
          <div className={styles.profileHeader}>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Dashboard</h1>
              <p className={styles.pageSubtitle}>
                Track your progress and achievements in coding competitions
              </p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Trophy size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>
                    {studentData.contestsParticipated}
                  </h3>
                  <p className={styles.statLabel}>Contests Participated</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Target size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>
                    {studentData.totalScore}
                  </h3>
                  <p className={styles.statLabel}>Total Points Earned</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Star size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>
                    {performanceData.filter(month => month.contests > 0).length}
                  </h3>
                  <p className={styles.statLabel}>Active Months</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <div className={styles.chartSection}>
            {/* Contests Participated Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>
                  Monthly Contest Participation ({new Date().getFullYear()})
                </h2>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: "#8b5cf6" }}
                    ></div>
                    <span>Contests Participated</span>
                  </div>
                </div>
              </div>
              <div className={styles.chartContent}>
                {performanceLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '250px',
                    fontSize: '14px',
                    color: '#718096'
                  }}>
                    Loading contest participation data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#718096" 
                        fontSize={12}
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis 
                        stroke="#718096" 
                        fontSize={12}
                        domain={contestsYAxisDomain}
                        tick={{ fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [value, 'Contests Participated']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="contests"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.7}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Total Score Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>
                  Score Performance Trends ({new Date().getFullYear()})
                </h2>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: "#4299e1" }}
                    ></div>
                    <span>Total Score</span>
                  </div>
                </div>
              </div>
              <div className={styles.chartContent}>
                {performanceLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '250px',
                    fontSize: '14px',
                    color: '#718096'
                  }}>
                    Loading score performance data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#718096" 
                        fontSize={12}
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis 
                        stroke="#718096" 
                        fontSize={12}
                        domain={scoresYAxisDomain}
                        tick={{ fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [value, 'Total Score']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalScore"
                        stroke="#4299e1"
                        strokeWidth={3}
                        dot={{ fill: "#4299e1", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 6, stroke: "#4299e1", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className={styles.progressSection}>
            <div className={styles.progressCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Year Overview</h2>
                <TrendingUp size={20} />
              </div>
              <div className={styles.progressContent}>
                <div className={styles.progressStats}>
                  <div className={styles.progressStat}>
                    <span className={styles.statLabel}>Total Contests</span>
                    <span className={styles.statValue}>
                      {performanceData.reduce((sum, month) => sum + month.contests, 0)}
                    </span>
                  </div>
                  <div className={styles.progressStat}>
                    <span className={styles.statLabel}>Total Points</span>
                    <span className={styles.statValue}>
                      {performanceData.reduce((sum, month) => sum + month.totalScore, 0)}
                    </span>
                  </div>
                  <div className={styles.progressStat}>
                    <span className={styles.statLabel}>Active Months</span>
                    <span className={styles.statValue}>
                      {performanceData.filter(month => month.contests > 0).length}
                    </span>
                  </div>
                </div>
                <div className={styles.progressVisualization}>
                  <div className={styles.circularProgress}>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#ff8a65"
                        strokeWidth="10"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * (performanceData.filter(month => month.contests > 0).length / 12))}
                        transform="rotate(-90 60 60)"
                        className={styles.progressCircle}
                      />
                      <text
                        x="60"
                        y="65"
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="600"
                        fill="#2d3748"
                      >
                        {Math.round((performanceData.filter(month => month.contests > 0).length / 12) * 100)}%
                      </text>
                    </svg>
                  </div>
                  <div className={styles.progressLabels}>
                    <span className={styles.progressLabel}>
                      Activity Progress
                    </span>
                    <span className={styles.progressDescription}>
                      {performanceData.filter(month => month.contests > 0).length} out of 12 months active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          currentUsername={studentData.userName}
        />
      )}
    </div>
  );
};

export default StudentUser;
