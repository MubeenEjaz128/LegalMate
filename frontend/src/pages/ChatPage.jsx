import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ChatBox from '../components/Chat/ChatBox';
import { MessageCircle, User, Loader2, Users, Paperclip, Inbox, Plus, Camera, Crown } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'All', icon: <Inbox className="h-5 w-5" /> },
  { key: 'unread', label: 'Unread', icon: <MessageCircle className="h-5 w-5" /> },
  { key: 'groups', label: 'Groups', icon: <Users className="h-5 w-5" /> },
  { key: 'attachments', label: 'Attachments', icon: <Paperclip className="h-5 w-5" /> },
];

const ChatPage = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [adminId, setAdminId] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await chatAPI.listConversations();
        setConversations(res.data || []);
      } catch (err) {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    // Fetch all users for group creation
    const fetchUsers = async () => {
      try {
        const res = await chatAPI.getHistory(user._id); // fallback: get chat partners
        let users = [];
        res.data?.forEach(conv => {
          if (user.role === 'client' && conv.lawyer) users.push(conv.lawyer);
          if (user.role === 'lawyer' && conv.client) users.push(conv.client);
        });
        setAllUsers(users);
      } catch {
        setAllUsers([]);
      }
    };
    fetchUsers();
  }, [user._id]);

  // Categorize conversations
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'unread') return conv.unreadCount > 0;
    if (activeTab === 'groups') return conv.isGroup;
    if (activeTab === 'attachments') return conv.hasAttachment;
    return true;
  }).filter(conv => {
    if (!search) return true;
    const name = user.role === 'client' ? conv.lawyer?.name : conv.client?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
  };

  return (
    <div className="flex h-[80vh] bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Sidebar with Tabs and Search */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white flex items-center gap-2 justify-between">
          <span className="font-semibold text-lg">Messenger</span>
          <button
            className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700"
            title="Create Group"
            onClick={() => setShowGroupModal(true)}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1 px-2 py-2 border-b bg-gray-50">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg transition text-xs ${activeTab === tab.key ? 'bg-primary-100 text-primary-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="p-2">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-gray-500 text-center mt-8">No conversations</div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv._id}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b hover:bg-primary-50 transition ${selectedConversation?._id === conv._id ? 'bg-primary-100' : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                {conv.isGroup && conv.groupAvatar ? (
                  <img src={conv.groupAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-purple-400" />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${conv.isGroup ? 'bg-purple-600' : 'bg-primary-600'}`}>
                    {conv.isGroup ? <Users className="h-6 w-6" /> : (conv.lawyer?.name?.charAt(0).toUpperCase() || conv.client?.name?.charAt(0).toUpperCase() || 'U')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {conv.isGroup ? conv.name : (user.role === 'client' ? conv.lawyer?.name : conv.client?.name)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {conv.lastMessage || 'No messages yet'}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">{conv.unreadCount}</span>
                )}
                {conv.hasAttachment && (
                  <Paperclip className="ml-2 h-4 w-4 text-gray-400" />
                )}
              </button>
            ))
          )}
        </div>
        {/* Group Creation Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Create Group</h2>
              <input
                className="input-field mb-3 w-full"
                placeholder="Group Name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <div className="mb-3">
                <div className="font-medium mb-1">Add Members</div>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {allUsers.map(u => (
                    <label key={u._id} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={groupMembers.includes(u._id)}
                        onChange={e => {
                          if (e.target.checked) setGroupMembers([...groupMembers, u._id]);
                          else setGroupMembers(groupMembers.filter(id => id !== u._id));
                        }}
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button className="btn-outline" onClick={() => setShowGroupModal(false)}>Cancel</button>
                <button
                  className="btn-primary"
                  disabled={!groupName || groupMembers.length < 2 || creatingGroup}
                  onClick={async () => {
                    setCreatingGroup(true);
                    try {
                      await chatAPI.createGroup({ name: groupName, members: [user._id, ...groupMembers] });
                      setShowGroupModal(false);
                      setGroupName('');
                      setGroupMembers([]);
                      // Refresh conversations
                      const res = await chatAPI.listConversations();
                      setConversations(res.data || []);
                    } finally {
                      setCreatingGroup(false);
                    }
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatBox
            conversationId={selectedConversation._id}
            toUser={selectedConversation.isGroup ? null : (user.role === 'client' ? selectedConversation.lawyer : selectedConversation.client)}
            isGroup={selectedConversation.isGroup}
            groupName={selectedConversation.groupName}
            groupMembers={selectedConversation.members}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <MessageCircle className="h-12 w-12 mb-4" />
            <div className="ml-4">
              <div className="font-semibold text-lg">Select a conversation to start messaging</div>
              <div className="text-sm mt-2">Your messages with lawyers, clients, or groups will appear here.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage; 