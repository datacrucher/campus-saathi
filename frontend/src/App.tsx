import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homeFor, useAuth } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { CaseStoreProvider } from './data/CaseStore';
import { ToastProvider } from './components/Toast';
import { AppShell } from './components/AppShell';
import { ErrorState } from './components/ui';
import Login from './pages/Login';
import GetHelp from './pages/GetHelp';
import StudentHome from './pages/student/StudentHome';
import FindSupport from './pages/student/FindSupport';
import MyRequests from './pages/student/MyRequests';
import RequestDetail from './pages/student/RequestDetail';
import { ServiceDetail, Services } from './pages/student/Services';
import Emergency from './pages/student/Emergency';
import StaffCases from './pages/staff/StaffCases';
import CaseDetail from './pages/shared/CaseDetail';
import Profile from './pages/shared/Profile';
import Overview from './pages/admin/Overview';
import Cases from './pages/admin/Cases';
import { DepartmentDetail, Departments } from './pages/admin/Departments';
import { StudentDetail, Students } from './pages/admin/Students';
import Reports from './pages/admin/Reports';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

function NotFound() {
  const { user } = useAuth();
  return (
    <div className="page"><div className="container narrow"><div className="panel">
      <ErrorState title="Page not found" action={<Link to={user ? homeFor(user.role) : '/login'} className="btn btn-secondary">Go to Campus Saathi home</Link>}>
        The page you were looking for doesn’t exist or has moved.
      </ErrorState>
    </div></div></div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CaseStoreProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/get-help" element={<GetHelp />} />

              <Route path="/student" element={<RequireRole role="student"><AppShell role="student" /></RequireRole>}>
                <Route index element={<StudentHome />} />
                <Route path="support" element={<FindSupport />} />
                <Route path="requests" element={<MyRequests />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="services" element={<Services />} />
                <Route path="services/:id" element={<ServiceDetail />} />
                <Route path="emergency" element={<Emergency />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/staff" element={<RequireRole role="staff"><AppShell role="staff" /></RequireRole>}>
                <Route index element={<StaffCases scope="mine" />} />
                <Route path="queue" element={<StaffCases scope="queue" />} />
                <Route path="cases/:id" element={<CaseDetail role="staff" />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/admin" element={<RequireRole role="admin"><AppShell role="admin" /></RequireRole>}>
                <Route index element={<Overview />} />
                <Route path="cases" element={<Cases />} />
                <Route path="cases/:id" element={<CaseDetail role="admin" />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="departments" element={<Departments />} />
                <Route path="departments/:id" element={<DepartmentDetail />} />
                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </CaseStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
