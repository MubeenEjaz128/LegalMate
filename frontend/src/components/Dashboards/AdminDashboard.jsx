import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, CheckCircle, XCircle, BarChart, Flag, Award, Shield, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import UserManagement from './UserManagement';
import AnalyticsView from './AnalyticsView';
import SystemSettings from './SystemSettings';
import { appointmentAPI } from '../../services/api';

const AdminDashboard = () => {
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [isLoading, setIsLoading] = useState({
    lawyers: false,
    analytics: false,
    flagged: false
  });
  const [error, setError] = useState(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [chatLogs, setChatLogs] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [chatUserId, setChatUserId] = useState('');
  const [chatConversationId, setChatConversationId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [conversationList, setConversationList] = useState([]);
  const [videoCallLogs, setVideoCallLogs] = useState([]);
  const [videoCallLoading, setVideoCallLoading] = useState(false);
  const [videoCallPage, setVideoCallPage] = useState(1);
  const [videoCallTotalPages, setVideoCallTotalPages] = useState(1);
  const [videoCallUserId, setVideoCallUserId] = useState('');
  const [videoCallRoleFilter, setVideoCallRoleFilter] = useState('all');
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const { token, user } = useAuthStore();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      setError('Access denied. Admin privileges required.');
    }
  }, [user]);

  // Fetch data on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingLawyers();
      fetchAnalytics();
      fetchFlaggedContent();
    }
  }, [user]);

  useEffect(() => {
    // Fetch all users for the dropdown
    const fetchAllUsers = async () => {
      try {
        const res = await api.get('/admin/users', { params: { limit: 1000 } });
        setAllUsers(res.data.users || []);
      } catch (err) {
        setAllUsers([]);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    // Fetch unique conversation IDs for the selected user
    const fetchConversations = async () => {
      try {
        let params = {};
        if (chatUserId) params.userId = chatUserId;
        const res = await api.get('/admin/chat-logs', { params: { ...params, limit: 1000 } });
        const allConvs = res.data.messages.map(m => m.conversationId);
        const uniqueConvs = Array.from(new Set(allConvs));
        setConversationList(uniqueConvs);
      } catch (err) {
        setConversationList([]);
      }
    };
    fetchConversations();
  }, [chatUserId, userRoleFilter, allUsers]);

  const fetchPendingLawyers = async () => {
    setIsLoading(prev => ({ ...prev, lawyers: true }));
    setError(null);
    try {
      console.log('Fetching pending lawyers...');
      const response = await api.get('/admin/verification-requests');
      console.log('Pending lawyers response:', response.data);
      setPendingLawyers(response.data);
    } catch (error) {
      console.error('Error fetching pending lawyers:', error);
      const message = error.response?.data?.message || 'Failed to fetch pending lawyers';
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(prev => ({ ...prev, lawyers: false }));
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(prev => ({ ...prev, analytics: true }));
    setError(null);
    try {
      console.log('Fetching analytics...');
      console.log('API URL:', api.defaults.baseURL);
      console.log('Auth token:', localStorage.getItem('auth-storage'));
      
      const response = await api.get('/admin/stats');
      console.log('Analytics response:', response.data);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let message = 'Failed to fetch analytics';
      if (error.response?.status === 401) {
        message = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 403) {
        message = 'Access denied. Admin privileges required.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Auto-refresh analytics every 30 seconds
  useEffect(() => {
    if (user?.role === 'admin') {
      const interval = setInterval(() => {
        fetchAnalytics();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchFlaggedContent = async () => {
    setIsLoading(prev => ({ ...prev, flagged: true }));
    setError(null);
    try {
      console.log('Fetching flagged content...');
      const response = await api.get('/admin/flagged-content');
      console.log('Flagged content response:', response.data);
      setFlaggedContent(response.data);
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      const message = error.response?.data?.message || 'Failed to fetch flagged content';
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(prev => ({ ...prev, flagged: false }));
    }
  };

  const fetchChatLogs = async (page = 1) => {
    setChatLoading(true);
    try {
      const params = { page, userId: chatUserId, conversationId: chatConversationId };
      const res = await api.get('/admin/chat-logs', { params });
      setChatLogs(res.data.messages);
      setChatPage(res.data.pagination.page);
      setChatTotalPages(res.data.pagination.pages);
    } catch (err) {
      setChatLogs([]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchVideoCallLogs = async (page = 1) => {
    setVideoCallLoading(true);
    try {
      const params = { page, userId: videoCallUserId };
      const res = await api.get('/admin/video-call-logs', { params });
      setVideoCallLogs(res.data.logs);
      setVideoCallPage(res.data.pagination.page);
      setVideoCallTotalPages(res.data.pagination.pages);
    } catch (err) {
      setVideoCallLogs([]);
    } finally {
      setVideoCallLoading(false);
    }
  };

  // Handle lawyer verification
  const handleVerifyLawyer = async (lawyerId, action) => {
    try {
      console.log(`Verifying lawyer ${lawyerId} with action: ${action}`);
      if (action === 'approve') {
        await api.post(`/admin/verify-lawyer/${lawyerId}`, {});
        toast.success('Lawyer approved successfully');
      } else {
        // For reject, we'll deactivate the lawyer
        await api.patch(`/admin/users/${lawyerId}/status`, { isActive: false });
        toast.success('Lawyer rejected successfully');
      }
      fetchPendingLawyers(); // Refresh the list
    } catch (error) {
      console.error('Error verifying lawyer:', error);
      const message = error.response?.data?.message || `Failed to ${action} lawyer`;
      toast.error(message);
    }
  };

  // Handle content moderation
  const handleModerateContent = async (contentId, action) => {
    try {
      console.log(`Moderating content ${contentId} with action: ${action}`);
      await api.post('/admin/moderate-content', { contentId, action });
      toast.success(`Content ${action} successfully`);
      fetchFlaggedContent(); // Refresh the list
    } catch (error) {
      console.error('Error moderating content:', error);
      const message = error.response?.data?.message || `Failed to ${action} content`;
      toast.error(message);
    }
  };

  // Test admin API access
  const testAdminAPI = async () => {
    try {
      console.log('Testing admin API access...');
      const response = await api.get('/admin/test');
      console.log('Admin API test response:', response.data);
      toast.success('Admin API is working!');
    } catch (error) {
      console.error('Admin API test failed:', error);
      toast.error('Admin API test failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // Test backend health
  const testBackendHealth = async () => {
    try {
      console.log('Testing backend health...');
      const response = await api.get('/health');
      console.log('Backend health response:', response.data);
      toast.success('Backend is healthy!');
    } catch (error) {
      console.error('Backend health test failed:', error);
      toast.error('Backend health test failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // Refresh all data
  const refreshAll = () => {
    fetchPendingLawyers();
    fetchAnalytics();
    fetchFlaggedContent();
  };

  const stats = [
    {
      title: 'Total Users',
      value: analytics?.users?.total || 0,
      icon: <Users className="h-8 w-8" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Appointments',
      value: analytics?.appointments?.total || 0,
      icon: <BarChart className="h-8 w-8" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Flagged Content',
      value: flaggedContent?.length || 0,
      icon: <Flag className="h-8 w-8" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Pending Verifications',
      value: pendingLawyers?.length || 0,
      icon: <Award className="h-8 w-8" />,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  // Fetch pending transactions for admin approval
  const fetchPendingTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const res = await appointmentAPI.list();
      // Only show appointments with paymentStatus 'pending' and with a transaction
      const pending = (res.data || []).filter(
        apt => apt.paymentStatus === 'pending' && apt.transaction
      );
      setPendingTransactions(pending);
    } catch (err) {
      setPendingTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingTransactions();
    }
  }, [user]);

  const handleApprove = async (appointmentId) => {
    try {
      await appointmentAPI.adminApprove(appointmentId);
      toast.success('Payment released to lawyer');
      fetchPendingTransactions();
    } catch (err) {
      toast.error('Failed to approve payment');
    }
  };

  const handleApproveRefund = async (appointmentId) => {
    try {
      await appointmentAPI.adminApproveRefund(appointmentId);
      toast.success('Refund approved and credits returned to client');
      fetchPendingTransactions();
    } catch (err) {
      toast.error('Failed to approve refund');
    }
  };

  // Show error state
  if (error && error.includes('Access denied')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-error-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage lawyers, moderate content, and view system analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={testBackendHealth}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                Health Check
              </button>
              <button
                onClick={testAdminAPI}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                Test API
              </button>
              <button
                onClick={refreshAll}
                className="btn-outline flex items-center gap-2"
                disabled={Object.values(isLoading).some(loading => loading)}
              >
                <RefreshCw className={`h-4 w-4 ${Object.values(isLoading).some(loading => loading) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-6">
            <p className="font-medium">Error: {error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Analytics Overview */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">System Analytics</h2>
          <button
            onClick={fetchAnalytics}
            disabled={isLoading.analytics}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading.analytics ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </button>
        </div>
        
        {isLoading.analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-hover animate-pulse">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-300 mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card mb-8">
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <BarChart className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card-hover">
                <div className="flex items-center">
                  <div className={`bg-gradient-to-br ${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mr-4`}>
                    {stat.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{stat.title}</h2>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Lawyer Verification Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pending Lawyer Verifications</h2>
              <div className="badge badge-warning">{pendingLawyers?.length || 0} pending</div>
            </div>
            
            {isLoading.lawyers ? (
              <div className="text-center py-8">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading pending verifications...</p>
              </div>
            ) : pendingLawyers?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No pending verifications</p>
                <p className="text-sm text-gray-500">All lawyers have been verified</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLawyers?.map((lawyer) => (
                  <div key={lawyer._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                        <p className="text-sm text-gray-600">{lawyer.specialization}</p>
                        <p className="text-sm text-gray-500">{lawyer.location}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyLawyer(lawyer._id, 'approve')}
                          className="btn-success px-4 py-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1 inline" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerifyLawyer(lawyer._id, 'reject')}
                          className="btn-danger px-4 py-2 text-sm"
                        >
                          <XCircle className="h-4 w-4 mr-1 inline" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flagged Content Moderation */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Flagged Content</h2>
              <div className="badge badge-error">{flaggedContent?.length || 0} flagged</div>
            </div>
            
            {isLoading.flagged ? (
              <div className="text-center py-8">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading flagged content...</p>
              </div>
            ) : flaggedContent?.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-success-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No flagged content</p>
                <p className="text-sm text-gray-500">All content is clean</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedContent?.map((content) => (
                  <div key={content._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>User:</strong> {content.userName}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Content:</strong> {content.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Reason:</strong> {content.reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerateContent(content._id, 'remove')}
                        className="btn-danger px-4 py-2 text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-1 inline" />
                        Remove
                      </button>
                      <button
                        onClick={() => handleModerateContent(content._id, 'approve')}
                        className="btn-success px-4 py-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1 inline" />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowUserManagement(true)}
              className="btn-outline flex items-center justify-center py-4 hover:bg-primary-50 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              View All Users
            </button>
            <button 
              onClick={() => setShowAnalytics(true)}
              className="btn-outline flex items-center justify-center py-4 hover:bg-primary-50 transition-colors"
            >
              <BarChart className="h-5 w-5 mr-2" />
              View Analytics
            </button>
            <button 
              onClick={() => setShowSystemSettings(true)}
              className="btn-outline flex items-center justify-center py-4 hover:bg-primary-50 transition-colors"
            >
              <Shield className="h-5 w-5 mr-2" />
              System Settings
            </button>
          </div>
        </div>

        {/* Chat Logs Section */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold mb-4">Chat Logs (Admin)</h2>
          <form
            className="flex flex-wrap gap-2 mb-4"
            onSubmit={e => { e.preventDefault(); fetchChatLogs(1); }}
          >
            <select
              className="input input-bordered"
              value={userRoleFilter}
              onChange={e => setUserRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="lawyer">Lawyer</option>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="input input-bordered"
              value={chatUserId}
              onChange={e => setChatUserId(e.target.value)}
            >
              <option value="">All Users</option>
              {allUsers
                .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
                .map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}) - {u._id} [{u.role}]
                  </option>
                ))}
            </select>
            {conversationList.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="font-medium">Conversations:</span>
                {conversationList.map(cid => (
                  <button
                    key={cid}
                    className={`badge ${chatConversationId === cid ? 'badge-primary' : 'badge-outline'}`}
                    onClick={() => { setChatConversationId(cid); fetchChatLogs(1); }}
                  >
                    {cid}
                  </button>
                ))}
                <button
                  className="badge badge-outline"
                  onClick={() => { setChatConversationId(''); fetchChatLogs(1); }}
                  disabled={!chatConversationId}
                >
                  Show All
                </button>
              </div>
            )}
            <button type="submit" className="btn-primary">Search</button>
          </form>
          {chatLoading ? (
            <div>Loading chat logs...</div>
          ) : chatLogs.length === 0 ? (
            <div>No chat logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Timestamp</th>
                    <th className="px-2 py-1">From</th>
                    <th className="px-2 py-1">To</th>
                    <th className="px-2 py-1">Message</th>
                    <th className="px-2 py-1">Conversation ID</th>
                  </tr>
                </thead>
                <tbody>
                  {chatLogs.map(msg => (
                    <tr key={msg._id}>
                      <td className="px-2 py-1 text-xs">{new Date(msg.timestamp).toLocaleString()}</td>
                      <td className="px-2 py-1">{msg.from?.name || msg.from?.email || msg.from}</td>
                      <td className="px-2 py-1">{msg.to?.name || msg.to?.email || msg.to}</td>
                      <td className="px-2 py-1">{msg.message}</td>
                      <td className="px-2 py-1 text-xs">{msg.conversationId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn-outline"
                  disabled={chatPage <= 1}
                  onClick={() => fetchChatLogs(chatPage - 1)}
                >
                  Prev
                </button>
                <span>Page {chatPage} of {chatTotalPages}</span>
                <button
                  className="btn-outline"
                  disabled={chatPage >= chatTotalPages}
                  onClick={() => fetchChatLogs(chatPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Call Logs Section */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold mb-4">Video Call Logs (Admin)</h2>
          <form
            className="flex flex-wrap gap-2 mb-4"
            onSubmit={e => { e.preventDefault(); fetchVideoCallLogs(1); }}
          >
            <select
              className="input input-bordered"
              value={videoCallRoleFilter}
              onChange={e => setVideoCallRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="lawyer">Lawyer</option>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="input input-bordered"
              value={videoCallUserId}
              onChange={e => setVideoCallUserId(e.target.value)}
            >
              <option value="">All Users</option>
              {allUsers
                .filter(u => videoCallRoleFilter === 'all' || u.role === videoCallRoleFilter)
                .map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}) - {u._id} [{u.role}]
                  </option>
                ))}
            </select>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          {videoCallLoading ? (
            <div>Loading video call logs...</div>
          ) : videoCallLogs.length === 0 ? (
            <div>No video call logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Start Time</th>
                    <th className="px-2 py-1">End Time</th>
                    <th className="px-2 py-1">Duration (min)</th>
                    <th className="px-2 py-1">Client</th>
                    <th className="px-2 py-1">Lawyer</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Session ID</th>
                  </tr>
                </thead>
                <tbody>
                  {videoCallLogs.map(log => (
                    <tr key={log._id}>
                      <td className="px-2 py-1 text-xs">{log.startTime ? new Date(log.startTime).toLocaleString() : '-'}</td>
                      <td className="px-2 py-1 text-xs">{log.endTime ? new Date(log.endTime).toLocaleString() : '-'}</td>
                      <td className="px-2 py-1">{log.durationMinutes ?? '-'}</td>
                      <td className="px-2 py-1">{log.client?.name} ({log.client?.email})</td>
                      <td className="px-2 py-1">{log.lawyer?.name} ({log.lawyer?.email})</td>
                      <td className="px-2 py-1">{log.status}</td>
                      <td className="px-2 py-1 text-xs">{log.sessionId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn-outline"
                  disabled={videoCallPage <= 1}
                  onClick={() => fetchVideoCallLogs(videoCallPage - 1)}
                >
                  Prev
                </button>
                <span>Page {videoCallPage} of {videoCallTotalPages}</span>
                <button
                  className="btn-outline"
                  disabled={videoCallPage >= videoCallTotalPages}
                  onClick={() => fetchVideoCallLogs(videoCallPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pending Transactions Section */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Payments & Refunds</h3>
          {transactionsLoading ? (
            <div>Loading...</div>
          ) : pendingTransactions.length === 0 ? (
            <div className="text-gray-500">No pending transactions.</div>
          ) : (
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2">Appointment</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Lawyer</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransactions.map((apt) => (
                  <tr key={apt._id}>
                    <td className="px-4 py-2">{apt._id}</td>
                    <td className="px-4 py-2">{apt.client?.name}</td>
                    <td className="px-4 py-2">{apt.lawyer?.name}</td>
                    <td className="px-4 py-2">{apt.amount}</td>
                    <td className="px-4 py-2">{apt.paymentStatus}</td>
                    <td className="px-4 py-2">
                      <button className="btn-success btn-xs mr-2" onClick={() => handleApprove(apt._id)}>
                        Approve
                      </button>
                      {apt.transaction?.refundRequested && (
                        <button className="btn-danger btn-xs" onClick={() => handleApproveRefund(apt._id)}>
                          Approve Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
      
      {showAnalytics && (
        <AnalyticsView onClose={() => setShowAnalytics(false)} />
      )}
      
      {showSystemSettings && (
        <SystemSettings onClose={() => setShowSystemSettings(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;