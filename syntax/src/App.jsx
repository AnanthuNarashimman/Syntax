import { StudentLogPage } from "./Pages/StudentLogPage.jsx";
import AdminLogPage from "./Pages/AdminLogPage.jsx";
import SuperAdminLogPage from "./Pages/SuperAdminLogPage.jsx";
import AdminDashboard from "./Pages/AdminDashboard.jsx";
import CreateContest from "./Pages/CreateContest.jsx";
import ManageContest from "./Pages/ManageContest.jsx";
import Participants from "./Pages/Participants.jsx";
import Analytics from "./Pages/Analytics.jsx";
import AdminProfile from "./Pages/AdminProfile.jsx";
import CreateQuizQuestions from "./Pages/CreateQuizQuestions.jsx";
import CreateContestQuestions from "./Pages/CreateContestQuestions.jsx";
import Articles from "./Pages/Articles.jsx";
import SuperAdminDashboard from "./Pages/SuperAdminDashboard.jsx";
import SuperManageUsers from "./Pages/SuperManageUsers.jsx";
import SuperManageContests from "./Pages/SuperManageContests.jsx";
import SuperAdminProfile from "./Pages/SuperAdminProfile.jsx";

import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ContestProvider } from './contexts/ContestContext';
import { AlertProvider } from './contexts/AlertContext';

function App() {
  return (
    <AlertProvider>
      <ContestProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/student-login" replace />} />
            <Route path="/student-login" element={<StudentLogPage />} />
            <Route path="/admin-login" element={<AdminLogPage />} />
            <Route path="/super-login" element={<SuperAdminLogPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/create-contest" element={<CreateContest />} />
            <Route path="/manage-contest" element={<ManageContest />} />
            <Route path="/manage-articles" element={<Articles />} />
            <Route path="/manage-participants" element={<Participants />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin-profile" element={<AdminProfile />} />
            <Route path="/create-quiz-questions" element={<CreateQuizQuestions />} />
            <Route path="/create-contest-questions" element={<CreateContestQuestions />} />
            
            {/* Super Admin Routes */}
            <Route path="/super-dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-manage-users" element={<SuperManageUsers />} />
            <Route path="/super-manage-contests" element={<SuperManageContests />} />
            <Route path="/super-profile" element={<SuperAdminProfile />} />
            
            <Route path="*" element={<Navigate to="/student-login" replace />} />
           </Routes>
        </Router>
      </ContestProvider>
    </AlertProvider>
  )
}

export default App
