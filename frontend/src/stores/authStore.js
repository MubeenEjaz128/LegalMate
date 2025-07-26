import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login user
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          console.log('Attempting login with:', { email })
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          console.log('Login successful:', { user: user.name, role: user.role })
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Set auth header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          console.error('Login error:', error.response?.data || error.message)
          const message = error.response?.data?.message || 'Login failed'
          set({
            isLoading: false,
            error: message
          })
          return { success: false, error: message }
        }
      },

      // Register user
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          console.log('Attempting registration with:', { 
            name: userData.name, 
            email: userData.email, 
            role: userData.role 
          })
          const response = await api.post('/auth/register', userData)
          const { user, token } = response.data
          
          console.log('Registration successful:', { user: user.name, role: user.role })
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Set auth header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          console.error('Registration error:', error.response?.data || error.message)
          const message = error.response?.data?.message || 'Registration failed'
          set({
            isLoading: false,
            error: message
          })
          return { success: false, error: message }
        }
      },

      // Logout user
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
        
        // Remove auth header
        delete api.defaults.headers.common['Authorization']
      },

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const { user } = get()
        return roles.includes(user?.role)
      },

      // Update user profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        try {
          // Separate password change from profile update
          const { currentPassword, newPassword, ...profileUpdate } = profileData
          
          let response
          
          // If password change is requested
          if (currentPassword && newPassword) {
            response = await api.put('/auth/change-password', {
              currentPassword,
              newPassword
            })
          }
          
          // Update profile data (excluding password fields)
          if (Object.keys(profileUpdate).length > 0) {
            response = await api.put('/auth/profile', profileUpdate)
          }
          
          if (response?.data?.user) {
            set({
              user: response.data.user,
              isLoading: false,
              error: null
            })
          }
          
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Profile update failed'
          set({
            isLoading: false,
            error: message
          })
          return { success: false, error: message }
        }
      },

      // Initialize auth state from stored token
      initializeAuth: async () => {
        const { token } = get()
        if (token) {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            const response = await api.get('/auth/me')
            const { user } = response.data
            
            set({
              user,
              isAuthenticated: true,
              error: null
            })
          } catch (error) {
            // Token is invalid, clear auth state
            get().logout()
          }
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
) 