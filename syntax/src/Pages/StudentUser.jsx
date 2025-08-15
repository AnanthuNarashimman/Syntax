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
  Award,
  Trophy,
  Target,
  TrendingUp,
  Edit3,
  Settings,
  BookOpen,
  Code,
  Star,
  Activity,
} from "lucide-react";
import styles from "../Styles/PageStyles/StudentUser.module.css";
import StudentNavbar from "../Components/StudentNavbar";
import Loader from "../Components/Loader";
import { useAlert } from "../contexts/AlertContext";
import SkillEditModal from "../Components/SkillEditModal";
import SettingsModal from "../Components/SettingsModal";

const getInitial = (name) =>
  name && name.length > 0 ? name[0].toUpperCase() : "?";

const StudentUser = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
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

  // Sample data for charts and components
  const performanceData = [
    { date: "Jan 15", practice: 25, contests: 15, avgScore: 78 },
    { date: "Jan 20", practice: 35, contests: 22, avgScore: 82 },
    { date: "Jan 25", practice: 28, contests: 18, avgScore: 75 },
    { date: "Feb 01", practice: 42, contests: 28, avgScore: 85 },
    { date: "Feb 05", practice: 38, contests: 25, avgScore: 88 },
    { date: "Feb 10", practice: 45, contests: 32, avgScore: 90 },
    { date: "Feb 15", practice: 52, contests: 38, avgScore: 92 },
  ];

  // const skillsData = [
  //   { skill: "Arrays", level: 85 },
  //   { skill: "Trees", level: 72 },
  //   { skill: "Graphs", level: 68 },
  //   { skill: "Dynamic Programming", level: 45 },
  //   { skill: "Algorithms", level: 78 },
  // ];

  const recentActivity = [
    {
      type: "contest",
      title: "Weekly Coding Challenge",
      score: 95,
      date: "2 days ago",
    },
    {
      type: "practice",
      title: "Array Problems Set",
      score: 88,
      date: "3 days ago",
    },
    {
      type: "quiz",
      title: "Data Structures Quiz",
      score: 92,
      date: "5 days ago",
    },
    {
      type: "contest",
      title: "Monthly Contest",
      score: 76,
      date: "1 week ago",
    },
  ];

  const achievements = [
    {
      icon: "🏆",
      title: "Top 10 Performer",
      description: "Ranked in top 10 this month",
    },
    {
      icon: "🎯",
      title: "Problem Solver",
      description: "Solved 100+ problems",
    },
    {
      icon: "⚡",
      title: "Speed Demon",
      description: "Fastest submission in contest",
    },
    {
      icon: "🔥",
      title: "Streak Master",
      description: "30-day practice streak",
    },
  ];

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
      } catch (error) {
        console.error(error);
        showError("Failed to load student profile");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [showError]);

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

  if (loading) {
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
              <h1 className={styles.pageTitle}>Student Profile</h1>
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
                  <p className={styles.statLabel}>Contests</p>
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
                  <p className={styles.statLabel}>Total Score</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statNumber}>89%</h3>
                  <p className={styles.statLabel}>Success Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className={styles.chartSection}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>Performance Analytics</h2>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: "#8b5cf6" }}
                    ></div>
                    <span>Practice Sessions</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: "#7c3aed" }}
                    ></div>
                    <span>Contest Participation</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: "#4299e1" }}
                    ></div>
                    <span>Average Score</span>
                  </div>
                </div>
              </div>
              <div className={styles.chartContent}>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="practice"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.7}
                    />
                    <Area
                      type="monotone"
                      dataKey="contests"
                      stackId="2"
                      stroke="#7c3aed"
                      fill="#7c3aed"
                      fillOpacity={0.7}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#4299e1"
                      strokeWidth={3}
                      dot={{ fill: "#4299e1", strokeWidth: 2, r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity & Achievements */}
          <div className={styles.contentGrid}>
            <div className={styles.activityCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Activity</h2>
                <Activity size={20} />
              </div>
              <div className={styles.activityList}>
                {recentActivity.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {activity.type === "contest" && <Trophy size={16} />}
                      {activity.type === "practice" && <Code size={16} />}
                      {activity.type === "quiz" && <BookOpen size={16} />}
                    </div>
                    <div className={styles.activityContent}>
                      <h4 className={styles.activityTitle}>{activity.title}</h4>
                      <p className={styles.activityDate}>{activity.date}</p>
                    </div>
                    <div className={styles.activityScore}>
                      <span className={styles.scoreValue}>
                        {activity.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.achievementsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Achievements</h2>
                <Award size={20} />
              </div>
              <div className={styles.achievementsList}>
                {achievements.map((achievement, index) => (
                  <div key={index} className={styles.achievementItem}>
                    <div className={styles.achievementIcon}>
                      {achievement.icon}
                    </div>
                    <div className={styles.achievementContent}>
                      <h4 className={styles.achievementTitle}>
                        {achievement.title}
                      </h4>
                      <p className={styles.achievementDescription}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className={styles.progressSection}>
            <div className={styles.progressCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Monthly Progress</h2>
                <TrendingUp size={20} />
              </div>
              <div className={styles.progressContent}>
                <div className={styles.progressStats}>
                  <div className={styles.progressStat}>
                    <span className={styles.statLabel}>Problems Solved</span>
                    <span className={styles.statValue}>156</span>
                  </div>
                  <div className={styles.progressStat}>
                    <span className={styles.statLabel}>Contest Rank</span>
                    <span className={styles.statValue}>#24</span>
                  </div>
                  <div className={styles.progressStat}>
                    <span className={styles.statLabel}>Success Rate</span>
                    <span className={styles.statValue}>89%</span>
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
                        strokeDashoffset="70"
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
                        75%
                      </text>
                    </svg>
                  </div>
                  <div className={styles.progressLabels}>
                    <span className={styles.progressLabel}>
                      Overall Progress
                    </span>
                    <span className={styles.progressDescription}>
                      Keep up the great work!
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
