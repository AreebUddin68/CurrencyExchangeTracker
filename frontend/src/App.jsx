import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Convert    from './pages/Convert';
import History    from './pages/History';
import AdminPanel from './pages/AdminPanel';
import Alerts from './pages/Alerts';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Crimson Pro, Georgia, serif',
              fontSize: '15px',
              background: '#FDF8EE',
              color: '#3D1F0A',
              border: '1px solid #C8B48A',
              borderRadius: '2px',
              boxShadow: '0 4px 16px rgba(98,43,20,0.15)'
            },
            success: { iconTheme: { primary: '#4A7C59', secondary: '#FDF8EE' } },
            error:   { iconTheme: { primary: '#8B2020', secondary: '#FDF8EE' } },
          }}
        />
        <Routes>
          <Route path="/"          element={<Navigate to="/login" />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/convert"   element={<ProtectedRoute><Convert /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/alerts"    element={<ProtectedRoute premiumOnly><Alerts /></ProtectedRoute>} />
          <Route path="/admin"     element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
