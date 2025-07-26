import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, User, Video, MessageCircle, Phone, Calendar, MapPin, Star, AlertCircle } from 'lucide-react'
import { appointmentAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import VideoCall from '../components/VideoCall/VideoCall'
import toast from 'react-hot-toast'

const ConsultationPage = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await appointmentAPI.getById(appointmentId)
        setAppointment(response.data)
        
        // Check if user is authorized for this consultation
        const isAuthorized = user._id === response.data.clientId || 
                           user._id === response.data.lawyerId ||
                           user.role === 'admin'
        
        if (!isAuthorized) {
          setError('You are not authorized to join this consultation')
          toast.error('Access denied')
        }
        
      } catch (err) {
        console.error('Error fetching appointment:', err)
        setError('Failed to load consultation details')
        toast.error('Failed to load consultation')
      } finally {
        setLoading(false)
      }
    }

    if (appointmentId && user?._id) {
      fetchAppointment()
    }
  }, [appointmentId, user._id])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      )
    }
    return stars
  }

  const handleStartVideoCall = () => {
    if (appointment.consultationType === 'video') {
      setShowVideoCall(true)
    } else {
      toast.error('This is a chat consultation, not a video call')
    }
  }

  const handleCloseVideoCall = () => {
    setShowVideoCall(false)
    toast.success('Video call ended')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Consultation Not Found</h3>
          <p className="text-gray-600 mb-4">The consultation you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isClient = user._id === appointment.clientId
  const isLawyer = user._id === appointment.lawyerId
  const otherParty = isClient ? appointment.lawyer : appointment.client

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Legal Consultation
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
              {appointment.consultationType === 'video' && (
                <button
                  onClick={handleStartVideoCall}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Video className="h-4 w-4" />
                  <span>Start Video Call</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Details */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultation Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(appointment.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{formatTime(appointment.time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {appointment.consultationType === 'video' ? (
                      <Video className="h-5 w-5 text-gray-400" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">
                        {appointment.consultationType === 'video' ? 'Video Call' : 'Chat Consultation'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">60 minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">Online</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{appointment.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Notes</h3>
                <p className="text-gray-700 leading-relaxed">{appointment.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointment.consultationType === 'video' && appointment.status === 'confirmed' && (
                  <button
                    onClick={handleStartVideoCall}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    <Video className="h-5 w-5" />
                    <span>Join Video Call</span>
                  </button>
                )}
                
                <button className="btn-outline flex items-center justify-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Send Message</span>
                </button>
                
                <button className="btn-outline flex items-center justify-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Call Now</span>
                </button>
                
                <button className="btn-outline flex items-center justify-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Reschedule</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Other Party Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isClient ? 'Lawyer' : 'Client'} Information
              </h3>
              
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
                  {otherParty?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h4 className="font-semibold text-gray-900">{otherParty?.name || 'Unknown'}</h4>
                <p className="text-sm text-gray-600">
                  {isClient ? otherParty?.specialization || 'Legal Expert' : 'Client'}
                </p>
              </div>
              
              {isClient && otherParty?.rating && (
                <div className="flex items-center justify-center space-x-1 mb-4">
                  {renderStars(otherParty.rating)}
                  <span className="text-sm text-gray-600 ml-2">
                    ({otherParty.rating}/5)
                  </span>
                </div>
              )}
              
              <div className="space-y-3">
                {otherParty?.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{otherParty.phone}</span>
                  </div>
                )}
                
                {otherParty?.email && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{otherParty.email}</span>
                  </div>
                )}
                
                {otherParty?.address && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{otherParty.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultation ID</span>
                  <span className="font-medium">{appointment._id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{formatDate(appointment.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee</span>
                  <span className="font-medium">PKR {appointment.lawyer?.hourlyRate || 0}/hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCall && (
        <VideoCall
          consultationId={appointmentId}
          userRole={user.role}
          onClose={handleCloseVideoCall}
        />
      )}
    </div>
  )
}

export default ConsultationPage 