import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Send, Paperclip, Users, UserPlus, UserMinus } from 'lucide-react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ChatBox = ({ conversationId, toUser, isGroup, groupName, groupMembers }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [removeMemberId, setRemoveMemberId] = useState('');
  const [members, setMembers] = useState(groupMembers || []);

  useEffect(() => {
    setMembers(groupMembers || []);
  }, [groupMembers]);

  useEffect(() => {
    // Fetch old messages
    chatAPI.getConversation(conversationId).then(res => setMessages(res.data));
    chatAPI.markAsRead(conversationId);
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-consultation', conversationId);
    socketRef.current.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.to === user._id) {
        chatAPI.markAsRead(conversationId);
      }
    });
    socketRef.current.on('typing', (data) => {
      if (data.from === toUser?._id) {
        setIsOtherTyping(true);
        setTimeout(() => setIsOtherTyping(false), 2000);
      }
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [conversationId, toUser?._id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;
    let msg;
    if (isGroup) {
      if (attachment) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', attachment);
        formData.append('conversationId', conversationId);
        formData.append('from', user._id);
        if (input) formData.append('message', input);
        const res = await chatAPI.uploadAttachment(formData);
        msg = res.data;
        setUploading(false);
        setAttachment(null);
        setInput('');
      } else {
        const res = await chatAPI.sendGroupMessage(conversationId, input);
        msg = res.data;
        setInput('');
      }
    } else {
      msg = {
        conversationId,
        from: user._id,
        to: toUser?._id,
        message: input,
      };
      if (attachment) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', attachment);
        formData.append('conversationId', conversationId);
        formData.append('from', user._id);
        if (toUser) formData.append('to', toUser._id);
        if (input) formData.append('message', input);
        const res = await chatAPI.uploadAttachment(formData);
        msg = res.data;
        setUploading(false);
        setAttachment(null);
        setInput('');
      } else {
        const res = await chatAPI.sendMessage(msg);
        msg = res.data;
        setInput('');
      }
    }
    socketRef.current.emit('chat-message', msg);
    setMessages(prev => [...prev, msg]);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socketRef.current && e.target.value) {
      socketRef.current.emit('typing', {
        conversationId,
        from: user._id,
        to: toUser?._id,
      });
    }
  };

  // Add member to group
  const handleAddMember = async () => {
    if (!addMemberId) return;
    await chatAPI.addGroupMember(conversationId, addMemberId);
    setMembers([...members, { _id: addMemberId }]);
    setAddMemberId('');
  };
  // Remove member from group
  const handleRemoveMember = async (id) => {
    await chatAPI.removeGroupMember(conversationId, id);
    setMembers(members.filter(m => m._id !== id));
  };

  return (
    <div className="flex flex-col h-96 border rounded-xl bg-white shadow p-4">
      {isGroup && (
        <div className="mb-2 flex items-center gap-2 border-b pb-2">
          <Users className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-700">{groupName}</span>
          <button className="ml-auto btn-outline text-xs px-2 py-1" onClick={() => setShowMembers(!showMembers)}>
            {showMembers ? 'Hide Members' : 'Show Members'}
          </button>
        </div>
      )}
      {isGroup && showMembers && (
        <div className="mb-2 border rounded p-2 bg-gray-50">
          <div className="font-medium mb-1">Members</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {members.map(m => (
              <span key={m._id} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                <Users className="h-3 w-3" /> {m.name || m._id}
                {m._id !== user._id && (
                  <button className="ml-1 text-red-500" onClick={() => handleRemoveMember(m._id)} title="Remove">
                    <UserMinus className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="input-field flex-1"
              placeholder="User ID to add"
              value={addMemberId}
              onChange={e => setAddMemberId(e.target.value)}
            />
            <button className="btn-primary px-2 py-1 text-xs" onClick={handleAddMember} disabled={!addMemberId}>
              <UserPlus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.from === user._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg ${msg.from === user._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {msg.attachmentUrl ? (
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-200">
                  {msg.attachmentName || 'Attachment'}
                </a>
              ) : msg.message}
              {msg.from === user._id && msg.isRead && (
                <span className="ml-2 text-xs text-green-400">Seen</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 items-center">
        <label className="cursor-pointer flex items-center">
          <Paperclip className="h-5 w-5 text-gray-400" />
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={uploading}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center" disabled={uploading}>
          <Send className="h-4 w-4" />
        </button>
      </form>
      {attachment && (
        <div className="text-xs text-gray-500 mt-1">Selected: {attachment.name}</div>
      )}
      {isOtherTyping && !isGroup && (
        <div className="text-xs text-gray-400 mt-1">{toUser?.name || 'User'} is typing...</div>
      )}
    </div>
  );
};

export default ChatBox;
