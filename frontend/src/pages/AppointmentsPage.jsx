import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Calendar, Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, Filter, Search } from 'lucide-react'
import { appointmentAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_yourkey');

function PaymentModal({ open, onClose, appointment, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Get clientSecret from backend
      const res = await appointmentAPI.pay(appointment._id);
      const clientSecret = res.data.clientSecret;
      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });
      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        onPaymentSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Pay for Appointment</h2>
        <form onSubmit={handlePay}>
          <div className="mb-4">
            <label className="block font-medium mb-2">Payment Method</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="form-radio"
                  disabled
                />
                <span>Credit/Debit Card (Stripe)</span>
              </label>
              {/* Future payment methods can be added here */}
            </div>
          </div>
          {paymentMethod === 'card' && (
            <div className="mb-4">
              <CardElement className="p-2 border rounded" />
            </div>
          )}
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading || !stripe}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
        <button className="btn-outline mt-4 w-full" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

const AppointmentsPage = () => {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, completed, cancelled, rejected
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointments, setSelectedAppointments] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundProof, setRefundProof] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundAppointment, setRefundAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentAPI.list()
      setAppointments(response.data || [])
    } catch (error) {
      toast.error('Failed to fetch appointments')
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-orange-100 text-orange-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (time) => {
    return time
  }

  const isUpcoming = (appointment) => {
    const appointmentDate = new Date(appointment.date + ' ' + appointment.time)
    return appointmentDate > new Date() && appointment.status === 'confirmed'
  }

  const isCompleted = (appointment) => {
    const appointmentDate = new Date(appointment.date + ' ' + appointment.time)
    return appointmentDate < new Date() && appointment.status === 'confirmed'
  }

  const isCancelled = (appointment) => {
    return appointment.status === 'cancelled'
  }

  const isRejected = (appointment) => {
    return appointment.status === 'rejected'
  }

  const filteredAppointments = appointments.filter(appointment => {
    // Filter by status
    if (filter === 'upcoming' && !isUpcoming(appointment)) return false
    if (filter === 'completed' && !isCompleted(appointment)) return false
    if (filter === 'cancelled' && !isCancelled(appointment)) return false
    if (filter === 'rejected' && !isRejected(appointment)) return false

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const clientName = appointment.client?.name?.toLowerCase() || ''
      const clientEmail = appointment.client?.email?.toLowerCase() || ''
      const date = formatDate(appointment.date).toLowerCase()
      
      return clientName.includes(searchLower) || 
             clientEmail.includes(searchLower) || 
             date.includes(searchLower)
    }

    return true
  })

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.cancel(appointmentId)
      toast.success('Appointment cancelled successfully')
      fetchAppointments() // Refresh the list
    } catch (error) {
      toast.error('Failed to cancel appointment')
      console.error('Error cancelling appointment:', error)
    }
  }

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      console.log('Updating appointment status:', appointmentId, status)
      await appointmentAPI.updateStatus(appointmentId, { status })
      toast.success(`Appointment ${status} successfully`)
      fetchAppointments() // Refresh the list
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error(`Failed to ${status} appointment: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleJoinConsultation = (appointmentId) => {
    // Navigate to consultation page
    window.open(`/consultation/${appointmentId}`, '_blank')
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedAppointments.length === 0) {
      toast.error('Please select appointments and an action')
      return
    }

    try {
      const promises = selectedAppointments.map(appointmentId => 
        appointmentAPI.updateStatus(appointmentId, { status: bulkAction })
      )
      
      await Promise.all(promises)
      toast.success(`Successfully updated ${selectedAppointments.length} appointments to ${bulkAction}`)
      setSelectedAppointments([])
      setBulkAction('')
      fetchAppointments()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to update appointments')
    }
  }

  const toggleAppointmentSelection = (appointmentId) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId) 
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    )
  }

  const selectAllAppointments = () => {
    setSelectedAppointments(filteredAppointments.map(apt => apt._id))
  }

  const clearSelection = () => {
    setSelectedAppointments([])
  }

  const handleOpenPayment = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentModalOpen(true);
  };
  const handleClosePayment = () => {
    setPaymentModalOpen(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const handleOpenRefund = (appointment) => {
    setRefundAppointment(appointment);
    setRefundModalOpen(true);
  };
  const handleCloseRefund = () => {
    setRefundModalOpen(false);
    setRefundAppointment(null);
    setRefundProof(null);
  };
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundProof) return;
    setRefundLoading(true);
    try {
      await appointmentAPI.requestRefund(refundAppointment._id, refundProof);
      toast.success('Refund requested. Admin will review your proof.');
      handleCloseRefund();
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to request refund');
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              My Appointments
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and view all your appointments
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'lawyer' && (
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchTerm('');
                  toast.success('Showing all appointments for management');
                }}
                className="btn-primary text-xs sm:text-sm px-3 py-2"
              >
                Manage All
              </button>
            )}
            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="btn-outline text-xs sm:text-sm px-3 py-2"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="select-field text-sm"
            >
              <option value="all">All Appointments</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
            
            {/* Lawyer Bulk Actions */}
            {user.role === 'lawyer' && (
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="select-field text-sm"
                  placeholder="Bulk Action"
                >
                  <option value="">Bulk Action</option>
                  <option value="confirmed">Confirm Selected</option>
                  <option value="completed">Mark Complete</option>
                  <option value="cancelled">Cancel Selected</option>
                  <option value="rejected">Reject Selected</option>
                </select>
                
                {selectedAppointments.length > 0 && (
                  <button
                    onClick={handleBulkAction}
                    className="btn-primary text-xs sm:text-sm px-3 py-2"
                  >
                    Apply ({selectedAppointments.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-500 text-sm">
            {filter === 'all' 
              ? "You don't have any appointments yet."
              : `No ${filter} appointments found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Lawyer Selection Controls */}
          {user.role === 'lawyer' && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <button
                  onClick={selectAllAppointments}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Clear Selection
                </button>
                {selectedAppointments.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedAppointments.length} selected
                  </span>
                )}
              </div>
            </div>
          )}
          
          {filteredAppointments.map((appointment) => (
            <div key={appointment._id} className="card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Selection Checkbox for Lawyers */}
                {user.role === 'lawyer' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedAppointments.includes(appointment._id)}
                      onChange={() => toggleAppointmentSelection(appointment._id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                )}
                {/* Appointment Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${getStatusBadge(appointment.status)} flex items-center gap-1`}>
                      {getStatusIcon(appointment.status)}
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    {isUpcoming(appointment) && (
                      <span className="badge badge-primary">Upcoming</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Client Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                        {appointment.client?.name || 'Client'}
                      </h3>
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {appointment.client?.email || 'No email'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {appointment.client?.phone || 'No phone'}
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Date & Time</h4>
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(appointment.time)}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Location</h4>
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {appointment.location || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="mt-3">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Notes</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {user.role === 'lawyer' ? (
                    // Lawyer Actions
                    <>
                      {appointment.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'confirmed')}
                            className="btn-success text-xs sm:text-sm px-3 py-2"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'rejected')}
                            className="btn-danger text-xs sm:text-sm px-3 py-2"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {appointment.status === 'confirmed' && isUpcoming(appointment) && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleJoinConsultation(appointment._id)}
                            className="btn-primary text-xs sm:text-sm px-3 py-2"
                          >
                            Join Consultation
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'completed')}
                            className="btn-success text-xs sm:text-sm px-3 py-2"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'cancelled')}
                            className="btn-danger text-xs sm:text-sm px-3 py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {appointment.status === 'completed' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <span className="text-green-600 text-xs sm:text-sm font-medium">
                            Completed
                          </span>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'confirmed')}
                            className="btn-outline text-xs sm:text-sm px-3 py-2"
                            title="Reopen appointment"
                          >
                            Reopen
                          </button>
                        </div>
                      )}
                      {appointment.status === 'cancelled' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <span className="text-red-600 text-xs sm:text-sm font-medium">
                            Cancelled
                          </span>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'confirmed')}
                            className="btn-outline text-xs sm:text-sm px-3 py-2"
                            title="Reactivate appointment"
                          >
                            Reactivate
                          </button>
                        </div>
                      )}
                      {appointment.status === 'rejected' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <span className="text-orange-600 text-xs sm:text-sm font-medium">
                            Rejected
                          </span>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment._id, 'confirmed')}
                            className="btn-outline text-xs sm:text-sm px-3 py-2"
                            title="Approve appointment"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                      
                      {/* Quick Status Change for Lawyers */}
                      {user.role === 'lawyer' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={appointment.status}
                            onChange={(e) => handleUpdateAppointmentStatus(appointment._id, e.target.value)}
                            className="select-field text-xs sm:text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    // Client Actions
                    <>
                      {isUpcoming(appointment) && (
                        <>
                          <button
                            onClick={() => handleJoinConsultation(appointment._id)}
                            className="btn-primary text-xs sm:text-sm px-3 py-2"
                          >
                            Join Consultation
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="btn-danger text-xs sm:text-sm px-3 py-2"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {isCompleted(appointment) && (
                        <span className="text-green-600 text-xs sm:text-sm font-medium">
                          Completed
                        </span>
                      )}
                      {isCancelled(appointment) && (
                        <span className="text-red-600 text-xs sm:text-sm font-medium">
                          Cancelled
                        </span>
                      )}
                      {user.role === 'client' && appointment.paymentStatus !== 'paid' && (
                        <button
                          className="btn-primary text-xs sm:text-sm px-3 py-2"
                          disabled
                        >
                          Paid with Credits
                        </button>
                      )}
                      {user.role === 'client' && appointment.paymentStatus === 'paid' && !appointment.transaction?.refundRequested && (
                        <button
                          className="btn-danger text-xs sm:text-sm px-3 py-2"
                          onClick={() => handleOpenRefund(appointment)}
                        >
                          Request Refund
                        </button>
                      )}
                      {user.role === 'client' && appointment.transaction?.refundRequested && (
                        <span className="text-yellow-600 text-xs sm:text-sm font-medium">Refund Requested</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredAppointments.length > 0 && (
        <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => isUpcoming(apt)).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Upcoming</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => isCompleted(apt)).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => isCancelled(apt)).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Cancelled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => isRejected(apt)).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Rejected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appointments.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Lawyer Quick Actions */}
      {user.role === 'lawyer' && !loading && appointments.length > 0 && (
        <div className="mt-6 sm:mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => {
                const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
                if (pendingAppointments.length > 0) {
                  setFilter('all');
                  setSearchTerm('');
                  toast.success(`Found ${pendingAppointments.length} pending appointments`);
                } else {
                  toast.info('No pending appointments found');
                }
              }}
              className="btn-outline text-sm py-3"
            >
              <div className="text-lg font-bold text-yellow-600">
                {appointments.filter(apt => apt.status === 'pending').length}
              </div>
              <div className="text-xs">Pending</div>
            </button>
            
            <button
              onClick={() => {
                const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
                if (confirmedAppointments.length > 0) {
                  setFilter('all');
                  setSearchTerm('');
                  toast.success(`Found ${confirmedAppointments.length} confirmed appointments`);
                } else {
                  toast.info('No confirmed appointments found');
                }
              }}
              className="btn-outline text-sm py-3"
            >
              <div className="text-lg font-bold text-blue-600">
                {appointments.filter(apt => apt.status === 'confirmed').length}
              </div>
              <div className="text-xs">Confirmed</div>
            </button>
            
            <button
              onClick={() => {
                const completedAppointments = appointments.filter(apt => apt.status === 'completed');
                if (completedAppointments.length > 0) {
                  setFilter('all');
                  setSearchTerm('');
                  toast.success(`Found ${completedAppointments.length} completed appointments`);
                } else {
                  toast.info('No completed appointments found');
                }
              }}
              className="btn-outline text-sm py-3"
            >
              <div className="text-lg font-bold text-green-600">
                {appointments.filter(apt => apt.status === 'completed').length}
              </div>
              <div className="text-xs">Completed</div>
            </button>
            
            <button
              onClick={() => {
                const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');
                if (cancelledAppointments.length > 0) {
                  setFilter('all');
                  setSearchTerm('');
                  toast.success(`Found ${cancelledAppointments.length} cancelled appointments`);
                } else {
                  toast.info('No cancelled appointments found');
                }
              }}
              className="btn-outline text-sm py-3"
            >
              <div className="text-lg font-bold text-red-600">
                {appointments.filter(apt => apt.status === 'cancelled').length}
              </div>
              <div className="text-xs">Cancelled</div>
            </button>
          </div>
        </div>
      )}
      {/* Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Request Refund</h2>
            <form onSubmit={handleRefundSubmit}>
              <div className="mb-4">
                <label className="block font-medium mb-2">Upload Proof (image, PDF, etc.)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => setRefundProof(e.target.files[0])} required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={refundLoading || !refundProof}>
                {refundLoading ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </form>
            <button className="btn-outline mt-4 w-full" onClick={handleCloseRefund}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage 