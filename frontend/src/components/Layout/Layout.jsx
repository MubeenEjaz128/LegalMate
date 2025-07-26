import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Menu, X, User, LogOut, Settings, Bell, Search, Scale } from 'lucide-react'
import { useState } from 'react'

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  const navigation = [
    { name: 'Home', href: '/', public: true },
    { name: 'Find Lawyers', href: '/search', public: true },
    { name: 'Dashboard', href: '/dashboard', public: false },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.public || isAuthenticated
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-soft border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container-custom">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  LegalMate
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'text-primary-600 bg-primary-50 shadow-sm'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* Notifications */}
                  <button className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-error-500 rounded-full"></span>
                  </button>
                  
                  {/* User Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200">
                      <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-medium text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="font-medium">{user?.name}</span>
                      <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-strong py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-error-50 hover:text-error-600 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-primary-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm px-6 py-2"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-primary-600 p-2 rounded-xl hover:bg-primary-50 transition-all duration-200"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-2">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <div className="flex items-center px-4 py-3 mb-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mr-3 shadow-md">
                      <span className="text-white font-medium text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Dashboard
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-700 hover:text-error-600 hover:bg-error-50 rounded-xl transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 mt-4 space-y-3">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 text-base font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container-custom py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout 