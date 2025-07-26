import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api'
import { Link } from 'react-router-dom';
import {
  Calendar,
  MessageCircle,
  Search,
  Clock,
  User,
  Video,
  FileText,
  Star,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { appointmentAPI, chatAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import ClientAppointmentsList from '../Appointments/ClientAppointmentsList';

const ClientDashboard = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState(null);
  const [creditBalance, setCreditBalance] = useState(null);
  // Fetch credit balance
  useEffect(() => {
  let isMounted = true;
  const fetchCredit = async () => {
    try {
      const res = await authAPI.credit()
      if (isMounted) setCreditBalance(res.data.balance)
    } catch {
      if (isMounted) setCreditBalance(0)
    }
  }
  if (user?._id) fetchCredit()
  return () => { isMounted = false }
}, [user?._id])


  useEffect(() => {
    let isMounted = true;

    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        console.log('Fetching appointments for user:', user._id);
        const response = await appointmentAPI.list();
        console.log('Appointments response:', response.data);
        if (isMounted) {
          setAppointments(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        if (isMounted) {
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setAppointmentsLoading(false);
        }
      }
    };

    if (user?._id) {
      fetchAppointments();
    }

    return () => {
      isMounted = false;
    };
  }, [user._id]);

  useEffect(() => {
    let isMounted = true;

    const fetchChatHistory = async () => {
      try {
        setChatLoading(true);
        setChatError(null);
        console.log('Fetching chat history for user:', user._id);
        const response = await chatAPI.getHistory(user._id);
        if (isMounted) {
          setChatHistory(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        if (isMounted) {
          if (error.response?.status === 404) {
            setChatError('No chat history found.');
            setChatHistory([]);
          } else {
            setChatError('Failed to load chat history. Please try again later.');
            setChatHistory([]);
          }
        }
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    if (user?._id) {
      fetchChatHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [user._id]);

  const upcomingAppointments =
    appointments?.filter(
      (apt) => new Date(apt.date + ' ' + apt.time) > new Date() && apt.status === 'confirmed'
    ) || [];

  const pendingAppointments = appointments?.filter((apt) => apt.status === 'pending') || [];

  const pastAppointments =
    appointments?.filter((apt) => new Date(apt.date + ' ' + apt.time) < new Date()) || [];

  const totalSpent = pastAppointments.reduce((total, apt) => total + (apt.lawyer?.hourlyRate || 0), 0);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">Manage your legal consultations and appointments</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">Client</div>
            <div className="text-gray-500 text-sm">
              Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </div>
            <Link to="/profile" className="btn-outline mt-2 inline-block">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="card text-center">
          <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <div className="text-lg font-semibold text-gray-900">Appointments</div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Upcoming</span>
            <span>{upcomingAppointments.length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Pending</span>
            <span>{pendingAppointments.length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-900 font-bold mt-2">
            <span>Total</span>
            <span>{appointments.length}</span>
          </div>
        </div>

        <div className="card text-center">
          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-lg font-semibold text-gray-900">Total Spent</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            PKR {typeof totalSpent === 'number'
            ? totalSpent.toLocaleString()
            : '0'} 
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {pastAppointments.length} consultations completed
          </div>
        </div>

        {/* Credit Balance Card */}
        <div className="card text-center">
          <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-lg font-semibold text-gray-900">Credit Balance</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {typeof creditBalance === 'number'
              ? creditBalance.toLocaleString()
              : '...'} Credits
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Use credits to book appointments
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link
          to="/search"
          className="card-hover text-center p-6 hover:shadow-lg transition-shadow"
        >
          <Search className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Find a Lawyer</h3>
          <p className="text-gray-600">Search for legal experts</p>
        </Link>

        <Link
          to="/chat"
          className="card-hover text-center p-6 hover:shadow-lg transition-shadow"
        >
          <MessageCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat History</h3>
          <p className="text-gray-600">View past conversations</p>
        </Link>

        <div className="card-hover text-center p-6">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {upcomingAppointments.length} Upcoming
          </h3>
          <p className="text-gray-600">Appointments scheduled</p>
        </div>

        <div className="card-hover text-center p-6">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {pendingAppointments.length} Pending
          </h3>
          <p className="text-gray-600">Awaiting confirmation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-6 w-6 text-primary-600" />
            <div className="font-semibold text-gray-900">Upcoming Appointments</div>
          </div>
          {appointmentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No upcoming appointments
              </h3>
              <p className="text-gray-600 mb-4">
                You don't have any upcoming appointments scheduled.
              </p>
              <Link to="/search" className="btn-primary">
                Find a Lawyer
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {appointment.lawyer?.name?.charAt(0).toUpperCase() || 'L'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.lawyer?.name || 'Lawyer'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.lawyer?.specialization || 'Legal Expert'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(appointment.date)} at {formatTime(appointment.time)}
                          </span>
                          <span className="flex items-center">
                            {appointment.consultationType === 'video' ? (
                              <Video className="h-4 w-4 mr-1" />
                            ) : (
                              <MessageCircle className="h-4 w-4 mr-1" />
                            )}
                            {appointment.consultationType === 'video' ? 'Video Call' : 'Chat'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                      <Link
                        to={`/consultation/${appointment._id}`}
                        className="btn-primary text-sm"
                      >
                        Join
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-6 w-6 text-primary-600" />
            <div className="font-semibold text-gray-900">Recent Conversations</div>
          </div>
          {chatLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : chatError ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to load conversations
              </h3>
              <p className="text-gray-600">{chatError}</p>
            </div>
          ) : chatHistory?.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-600">
                Your conversations with lawyers will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory?.slice(0, 5).map((chat) => (
                <Link
                  to={`/chat/${chat._id}`}
                  key={chat._id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {chat.lawyer?.name?.charAt(0).toUpperCase() || 'L'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {chat.lawyer?.name || 'Lawyer'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-primary-600">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/chat" className="btn-outline mt-4 w-full">
            View All Conversations
          </Link>
        </div>
      </div>
      <div className="card mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Appointments</h3>
        <ClientAppointmentsList appointments={appointments} />
      </div>
      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          <div className="font-semibold text-gray-900 text-sm sm:text-base">
            My Appointments
          </div>
        </div>
        <Link to="/appointments" className="btn-outline mt-4 w-full text-xs sm:text-sm py-2">
          Manage Appointments
        </Link>
      </div>
    </div>
  );
};

export default ClientDashboard;