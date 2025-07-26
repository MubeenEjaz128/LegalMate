import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import BookingPage from './pages/BookingPage'
import Dashboard from './pages/Dashboard'
import LawyerProfilePage from './pages/LawyerProfilePage'
import ProfilePage from './pages/ProfilePage'
import AppointmentsPage from './pages/AppointmentsPage'
import ConsultationPage from './pages/ConsultationPage'
import VideoCallTest from './components/VideoCall/VideoCallTest'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import RoleRoute from './components/Auth/RoleRoute'
import ChatPage from './pages/ChatPage';

function App() {
  const { isAuthenticated, initializeAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from stored token
    initializeAuth()
  }, [initializeAuth])

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<Layout><SearchPage /></Layout>} />
        <Route path="/lawyer/:lawyerId" element={<Layout><LawyerProfilePage /></Layout>} />

        {/* Protected Routes */}
        <Route 
          path="/booking/:lawyerId" 
          element={
            <ProtectedRoute>
              <Layout><BookingPage /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute>
              <Layout><AppointmentsPage /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/consultation/:appointmentId" 
          element={
            <ProtectedRoute>
              <ConsultationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/test-video-call" 
          element={<VideoCallTest />} 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Layout><ChatPage /></Layout>
            </ProtectedRoute>
          } 
        />

        {/* Role-based Routes */}
        <Route 
          path="/lawyer-dashboard" 
          element={
            <RoleRoute allowedRoles={['lawyer']}>
              <Layout><Dashboard /></Layout>
            </RoleRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Layout><Dashboard /></Layout>
            </RoleRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
