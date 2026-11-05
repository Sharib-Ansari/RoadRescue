import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { VehicleProvider } from './context/VehicleContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MechanicDashboardPage from './pages/MechanicDashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import EmergencyPage from './pages/EmergencyPage';
import MechanicsPage from './pages/MechanicsPage';
import MechanicDetailPage from './pages/MechanicDetailPage';
import RequestMechanicPage from './pages/RequestMechanicPage';
import TrackingPage from './pages/TrackingPage';
import SparePartsPage from './pages/SparePartsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <VehicleProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Customer Dashboard - Protected for Customers only */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                {/* Mechanic Dashboard - Protected for Mechanics only */}
                <Route
                  path="/mechanic/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['mechanic']}>
                      <MechanicDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles"
                  element={
                    <ProtectedRoute>
                      <VehiclesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/emergency"
                  element={
                    <ProtectedRoute>
                      <EmergencyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tracking/:requestId"
                  element={
                    <ProtectedRoute>
                      <TrackingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mechanics"
                  element={
                    <ProtectedRoute>
                      <MechanicsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mechanics/:id"
                  element={
                    <ProtectedRoute>
                      <MechanicDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/request-mechanic/:id"
                  element={
                    <ProtectedRoute>
                      <RequestMechanicPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spare-parts"
                  element={
                    <ProtectedRoute>
                      <SparePartsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </CartProvider>
          </VehicleProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
