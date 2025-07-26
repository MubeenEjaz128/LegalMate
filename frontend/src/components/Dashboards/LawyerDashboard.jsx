import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MessageCircle, Clock, User, DollarSign, Star, CheckCircle, XCircle, Edit, Settings } from 'lucide-react'
import { appointmentAPI, chatAPI, lawyerAPI } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { authAPI } from '../../services/api'
import { toast } from 'react-hot-toast'

const LawyerDashboard = () => {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(true)
  const [earnings, setEarnings] = useState({ week: 0, month: 0, total: 0 })
  const [reviews, setReviews] = useState([])
  const [profile, setProfile] = useState(null)

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true)
        const response = await appointmentAPI.list()
        setAppointments(response.data || [])
      } catch (error) {
        setAppointments([])
      } finally {
        setAppointmentsLoading(false)
      }
    }
    if (user?._id) fetchAppointments()
  }, [user._id])

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setChatLoading(true)
        const response = await chatAPI.getHistoryForLawyer(user._id)
        setChatHistory(response.data || [])
      } catch (error) {
        setChatHistory([])
      } finally {
        setChatLoading(false)
      }
    }
    if (user?._id) fetchChatHistory()
  }, [user._id])

  // Fetch earnings and reviews
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.me()
        const data = response.data.user
        setProfile(data)
        setEarnings({
          week: data?.earningsWeek || 0,
          month: data?.earningsMonth || 0,
          total: data?.earningsTotal || 0,
        })
        setReviews(data?.reviews || [])
      } catch (error) {
        setProfile(null)
        setEarnings({ week: 0, month: 0, total: 0 })
        setReviews([])
      }
    }
    if (user?._id) fetchProfile()
  }, [user._id])

  const upcomingAppointments = appointments?.filter(apt => 
    new Date(apt.date + ' ' + apt.time) > new Date() && apt.status === 'confirmed'
  ) || []

  // Debug logging
  console.log('All appointments:', appointments);
  console.log('Upcoming appointments:', upcomingAppointments);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
  const formatTime = (time) => time

  const handleToggleAvailability = async () => {
    try {
      const response = await authAPI.toggleAvailability()
      if (response.data.user) {
        setProfile(response.data.user)
        toast.success(response.data.message)
      }
    } catch (error) {
      toast.error('Failed to toggle availability')
      console.error('Toggle availability error:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome, {user.name}!
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your legal practice and connect with clients</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {profile?.specialization || 'Specialization'}
              </div>
              <div className="text-gray-500 text-xs sm:text-sm truncate">
                {profile?.location || 'Location'}
              </div>
              <Link 
                to="/profile" 
                className="btn-outline mt-2 inline-block text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="card text-center">
          <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <div className="text-lg font-semibold text-gray-900">Appointments</div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Upcoming</span>
            <span>{upcomingAppointments.length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-900 font-bold mt-2">
            <span>Total</span>
            <span>{appointments.length}</span>
          </div>
        </div>

        <div className="card text-center">
          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-lg font-semibold text-gray-900">Total Earnings</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            PKR {earnings.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {appointments.length} consultations completed
          </div>
        </div>

        {/* Credit Balance Card */}
        <div className="card text-center">
          <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-lg font-semibold text-gray-900">Credit Balance</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {user.credits != null ? user.credits.toLocaleString() : '0'} Credits
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Credits are released after admin approval
          </div>
        </div>
      </div>

      {/* Chat & Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Chat History */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            <div className="font-semibold text-gray-900 text-sm sm:text-base">Recent Messages</div>
          </div>
          {chatLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              ))}
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-gray-500 text-xs sm:text-sm">No recent messages</div>
          ) : (
            <div className="space-y-2">
              {chatHistory.slice(0, 5).map(chat => (
                <Link 
                  to={`/chat/${chat._id}`} 
                  key={chat._id} 
                  className="flex items-center gap-3 border-b py-2 hover:bg-primary-50 rounded-lg transition p-2"
                >
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                      {chat.client?.name || 'Client'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {chat.lastMessage || 'No messages yet'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/chat" className="btn-outline mt-4 w-full">
            View All Conversations
          </Link>
        </div>

        {/* Availability & Profile */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <div className="font-semibold text-gray-900 text-sm sm:text-base">Availability & Profile</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs sm:text-sm">Status:</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-xs sm:text-sm ${profile?.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {profile?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <button
                  onClick={handleToggleAvailability}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    profile?.isAvailable 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {profile?.isAvailable ? 'Set Unavailable' : 'Set Available'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs sm:text-sm">Hourly Rate:</span>
              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                PKR {profile?.hourlyRate || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs sm:text-sm">Location:</span>
              <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-24 sm:max-w-none">
                {profile?.location || 'N/A'}
              </span>
            </div>
            <Link 
              to="/profile" 
              className="btn-primary mt-4 w-full text-xs sm:text-sm py-2"
            >
              <button className="h-7 w-6 sm:h sm:w-4" />
              Update Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LawyerDashboard
