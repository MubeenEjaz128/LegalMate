import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasAnyRole, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyRole(allowedRoles)) {
    // Redirect based on user role
    if (user?.role === 'client') {
      return <Navigate to="/dashboard" replace />
    } else if (user?.role === 'lawyer') {
      return <Navigate to="/lawyer-dashboard" replace />
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default RoleRoute 