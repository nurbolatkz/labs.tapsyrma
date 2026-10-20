import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./auth/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import LabDetail from "./pages/LabDetail.jsx";
import DemoLab from "./pages/DemoLab.jsx";
import StudentLab from "./pages/StudentLab.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import Dashboard from "./pages/teacher/Dashboard.jsx";
import NewLab from "./pages/teacher/NewLab.jsx";
import TeacherLab from "./pages/teacher/TeacherLab.jsx";
import Submission from "./pages/teacher/Submission.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="labs" element={<Catalog />} />
          <Route path="labs/:kind" element={<LabDetail />} />
          <Route path="labs/:kind/demo" element={<DemoLab />} />
          <Route path="lab/:assignmentId" element={<StudentLab />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="teacher" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="teacher/labs/new" element={<ProtectedRoute><NewLab /></ProtectedRoute>} />
          <Route path="teacher/labs/:id" element={<ProtectedRoute><TeacherLab /></ProtectedRoute>} />
          <Route path="teacher/submissions/:id" element={<ProtectedRoute><Submission /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
