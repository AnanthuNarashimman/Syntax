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

import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/student-login" replace />} />
        <Route path="/student-login" element={<StudentLogPage />} />
        <Route path="/admin-login" element={<AdminLogPage />} />
        <Route path="/super-login" element={<SuperAdminLogPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/create-contest" element={<CreateContest />} />
        <Route path="/manage-contest" element={<ManageContest />} />
        <Route path="/manage-participants" element={<Participants />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
<<<<<<< HEAD
        <Route path="/create-quiz-questions" element={<CreateQuizQuestions />} />
        <Route path="/create-contest-questions" element={<CreateContestQuestions />} />
=======
        <Route path="*" element={<Navigate to="/student-login" replace />} />
>>>>>>> 5f5678a6cbaf49207d54fcdd87efed6e64ea42b9
       </Routes>
    </Router>
  )
}

export default App
