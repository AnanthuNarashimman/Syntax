import { StudentLogPage } from "./Pages/StudentLogPage.jsx";
import AdminLogPage from "./Pages/AdminLogPage.jsx";
import SuperAdminLogPage from "./Pages/SuperAdminLogPage.jsx";

import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/student-login" element={<StudentLogPage />} />
        <Route path="/admin-login" element={<AdminLogPage />} />
        <Route path="/super-login" element={<SuperAdminLogPage />} />
      </Routes>
    </Router>
  )
}

export default App
