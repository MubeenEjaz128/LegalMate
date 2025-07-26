import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000, // Increased timeout for network access
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
          console.log('🔑 Token added to request:', authData.state.token.substring(0, 20) + '...');
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
        // Clear corrupted storage
        localStorage.removeItem('auth-storage');
      }
    }

    // Log the request for debugging
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('📋 Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (response) {
      switch (response.status) {
        case 401:
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
        case 404:
          // Skip toast for chat history endpoint to let frontend handle it
          if (config.url.includes('/chat/history/')) {
            return Promise.reject(error);
          }
          toast.error('Resource not found.');
          break;
        case 422:
          const errors = response.data?.errors || response.data?.message;
          if (Array.isArray(errors)) {
            errors.forEach((err) => toast.error(err));
          } else {
            toast.error(errors || 'Validation failed');
          }
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(response.data?.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  toggleAvailability: () => api.patch('/auth/toggle-availability'),
  credit: () => api.get('/auth/me/credit'),
};

export const lawyerAPI = {
  search: (filters) => api.get('/lawyers/search', { params: filters }),
  getById: (id) => api.get(`/lawyers/${id}`),
  getProfile: (id) => api.get(`/lawyers/profile/${id}`),
  getAvailability: (id, date) => api.get(`/lawyers/availability/${id}`, { params: { date } }),
  getReviews: (id) => api.get(`/lawyers/reviews/${id}`),
};

export const appointmentAPI = {
  book: (appointmentData) => api.post('/appointments', appointmentData),
  list: (filters) => api.get('/appointments', { params: filters }),
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, statusData) => api.patch(`/appointments/${id}/status`, statusData),
  pay: (id) => api.post(`/appointments/${id}/pay`),
  requestRefund: (id, proof) => api.post(`/appointments/${id}/request-refund`, { proof }),
  adminApprove: (id) => api.post(`/appointments/${id}/approve`),
  adminApproveRefund: (id) => api.post(`/appointments/${id}/approve-refund`),
};

export const feedbackAPI = {
  submit: (feedbackData) => api.post('/feedback/submit', feedbackData),
  getByLawyer: (lawyerId) => api.get(`/feedback/lawyer/${lawyerId}`),
  list: (filters) => api.get('/feedback/list', { params: filters }),
};

export const chatAPI = {
  getHistory: (userId) => api.get(`/chat/history/${userId}`),
  getHistoryForLawyer: (lawyerId) => api.get(`/chat/history/lawyer/${lawyerId}`),
  sendMessage: (messageData) => api.post('/chat/message', messageData),
  getConversation: (conversationId) => api.get(`/chat/conversation/${conversationId}`),
  getConversationMessages: (conversationId) => api.get(`/chat/${conversationId}`),
  markAsRead: (conversationId) => api.patch(`/chat/${conversationId}/read`),
  uploadAttachment: (formData) => api.post(`/chat/${formData.get('conversationId')}/attachment`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createGroup: (data) => api.post('/chat/group', data),
  listConversations: () => api.get('/chat/conversations'),
  addGroupMember: (groupId, memberId) => api.post(`/chat/group/${groupId}/add`, { memberId }),
  removeGroupMember: (groupId, memberId) => api.post(`/chat/group/${groupId}/remove`, { memberId }),
  sendGroupMessage: (conversationId, message) => api.post(`/chat/${conversationId}/group-message`, { message }),
  updateGroupAvatar: (groupId, formData) => api.post(`/chat/group/${groupId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addGroupAdmin: (groupId, adminId) => api.post(`/chat/group/${groupId}/add-admin`, { adminId }),
  removeGroupAdmin: (groupId, adminId) => api.post(`/chat/group/${groupId}/remove-admin`, { adminId }),
};

export const adminAPI = {
  verifyLawyer: (lawyerId, status) => api.put(`/admin/verify-lawyer/${lawyerId}`, { status }),
  moderateContent: (contentId, action) => api.put(`/admin/moderate-content/${contentId}`, { action }),
  getAnalytics: () => api.get('/admin/stats'),
  getUserList: (filters) => api.get('/admin/users', { params: filters }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  updateUserStatus: (userId, statusData) => api.patch(`/admin/users/${userId}/status`, statusData),
  getChatLogs: (params) => api.get('/admin/chat-logs', { params }),
  getVideoCallLogs: (params) => api.get('/admin/video-call-logs', { params }),
};

export const aiAPI = {
  chat: (message) => api.post('/ai/chat', { message }),
};

export default api;