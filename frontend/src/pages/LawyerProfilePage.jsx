import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Phone, 
  Mail, 
  Award, 
  Calendar, 
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Users,
  Shield
} from 'lucide-react'
import { lawyerAPI } from '../services/api'

const LawyerProfilePage = () => {
  const { lawyerId } = useParams()
  const [lawyer, setLawyer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLawyerProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await lawyerAPI.getById(lawyerId)
        setLawyer(response.data)
      } catch (err) {
        console.error('Error fetching lawyer profile:', err)
        setError(err.message || 'Failed to load lawyer profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (lawyerId) {
      fetchLawyerProfile()
    }
  }, [lawyerId])

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      )
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      )
    }

    return stars
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom py-12">
          <div className="text-center py-16">
            <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading lawyer profile...</h3>
            <p className="text-gray-600">Please wait while we fetch the details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom py-12">
          <div className="text-center py-16">
            <div className="bg-error-50 border border-error-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-error-600 mb-4">
                <User className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading profile</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link to="/search" className="btn-primary">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom py-12">
          <div className="text-center py-16">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <User className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lawyer not found</h3>
              <p className="text-gray-600 mb-4">The lawyer profile you're looking for doesn't exist.</p>
              <Link to="/search" className="btn-primary">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-soft border-b border-gray-100">
        <div className="container-custom py-8">
          <div className="flex items-center mb-6">
            <Link 
              to="/search" 
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Search
            </Link>
          </div>
          
          {/* Lawyer Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {lawyer.name.charAt(0).toUpperCase()}
              </div>
              {lawyer.isVerified && (
                <div className="absolute -top-2 -right-2 bg-success-500 text-white p-2 rounded-full shadow-md">
                  <Award className="h-4 w-4" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{lawyer.name}</h1>
                {lawyer.isVerified && (
                  <span className="badge badge-success">
                    <Shield className="h-4 w-4 mr-1" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xl text-primary-600 font-semibold mb-2">{lawyer.specialization}</p>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{lawyer.address}</span>
                </div>
                {lawyer.experience && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{lawyer.experience} years experience</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link
                to={`/booking/${lawyer._id}`}
                className="btn-primary px-8 py-3"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Consultation
              </Link>
              <button className="btn-outline px-6 py-3">
                <MessageCircle className="h-5 w-5 mr-2" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rating and Reviews */}
            {lawyer.rating > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rating & Reviews</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    {renderStars(lawyer.rating)}
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{lawyer.rating.toFixed(1)}</span>
                    <span className="text-gray-600 ml-2">({lawyer.reviewCount} reviews)</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 italic">"Excellent lawyer with deep knowledge of Punjab laws. Very professional and helpful."</p>
                  <p className="text-sm text-gray-500 mt-2">- Recent client review</p>
                </div>
              </div>
            )}

            {/* About */}
            {lawyer.bio && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{lawyer.bio}</p>
              </div>
            )}

            {/* Specializations */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-primary-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900">{lawyer.specialization}</span>
                </div>
                <div className="flex items-center p-4 bg-success-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-3" />
                  <span className="font-medium text-gray-900">Civil Law</span>
                </div>
                <div className="flex items-center p-4 bg-warning-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-warning-600 mr-3" />
                  <span className="font-medium text-gray-900">Family Law</span>
                </div>
                <div className="flex items-center p-4 bg-info-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-info-600 mr-3" />
                  <span className="font-medium text-gray-900">Property Law</span>
                </div>
              </div>
            </div>

            {/* Languages */}
            {lawyer.languages && lawyer.languages.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Languages</h2>
                <div className="flex flex-wrap gap-3">
                  {lawyer.languages.map((language, index) => (
                    <span key={index} className="badge badge-outline">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Fee</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  PKR {lawyer.hourlyRate.toLocaleString()}
                </div>
                <p className="text-gray-600">per hour</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                  <span>Initial consultation included</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                  <span>Flexible payment options</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                  <span>No hidden charges</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-3 text-primary-500" />
                  <span>Available for calls</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-3 text-primary-500" />
                  <span>Email consultation</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="h-4 w-4 mr-3 text-primary-500" />
                  <span>Chat available</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-3 text-primary-500" />
                  <span>Flexible scheduling</span>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-gray-400">Closed</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/booking/${lawyer._id}`}
                  className="btn-primary w-full text-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Link>
                <button className="btn-outline w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </button>
                <button className="btn-outline w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LawyerProfilePage 