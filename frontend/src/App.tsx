import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import Home from './pages/Home.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import SubmitProblem from './pages/SubmitProblem.js';
import ProblemList from './pages/ProblemList.js';
import ProblemDetail from './pages/ProblemDetail.js';
import AdminDashboard from './pages/AdminDashboard.js';
import UniversityDashboard from './pages/UniversityDashboard.js';
import IndustryPortal from './pages/IndustryPortal.js';
import ProjectDetail from './pages/ProjectDetail.js';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />

        <Route element={<ProtectedRoute allow={['citizen']} />}>
          <Route path="/submit" element={<SubmitProblem />} />
        </Route>
        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={['university']} />}>
          <Route path="/university" element={<UniversityDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={['industry']} />}>
          <Route path="/industry" element={<IndustryPortal />} />
        </Route>
        <Route element={<ProtectedRoute allow={['industry', 'university', 'admin']} />}>
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}
