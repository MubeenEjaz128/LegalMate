const express = require('express')
const { body, validationResult } = require('express-validator')
const { auth } = require('../middleware/auth')
const ChatMessage = require('../models/ChatMessage')
const router = express.Router()
const multer = require('multer');
const path = require('path');
const Conversation = require('../models/Conversation');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/chat'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get chat history for consultation
router.get('/:consultationId', auth, async (req, res) => {
  try {
    const { consultationId } = req.params
    const userId = req.user.userId

    // Verify user has access to this consultation
    // For now, allow access if user is authenticated
    const messages = await ChatMessage.find({ conversationId: consultationId })
      .populate('from', 'name')
      .populate('to', 'name')
      .sort({ timestamp: 1 })

    res.json(messages)
  } catch (error) {
    console.error('Get chat history error:', error)
    res.status(500).json({ message: 'Error fetching chat history' })
  }
})

// Send message
router.post('/:consultationId/message', auth, [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('message').isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { consultationId } = req.params
    const { message, to } = req.body
    const from = req.user.userId

    // Create chat message
    const chatMessage = new ChatMessage({
      conversationId: consultationId,
      from,
      to,
      message
    })
    
    await chatMessage.save()
    
    // Populate sender info
    await chatMessage.populate('from', 'name')
    await chatMessage.populate('to', 'name')

    res.json(chatMessage)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Error sending message' })
  }
})

// Upload attachment
router.post('/:consultationId/attachment', auth, upload.single('file'), async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { from, to, message } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const chatMessage = new ChatMessage({
      conversationId: consultationId,
      from,
      to,
      message: message || '',
      attachmentUrl: fileUrl,
      attachmentName: req.file.originalname,
      attachmentType: req.file.mimetype
    });
    await chatMessage.save();
    await chatMessage.populate('from', 'name');
    await chatMessage.populate('to', 'name');
    res.json(chatMessage);
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Error uploading attachment' });
  }
});

// Mark messages as read in a conversation
router.patch('/:consultationId/read', auth, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.userId;
    // Mark all messages sent to this user as read
    const result = await ChatMessage.updateMany(
      { conversationId: consultationId, to: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ updated: result.nModified || result.modifiedCount });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Get consultation participants
router.get('/:consultationId/participants', auth, async (req, res) => {
  try {
    const { consultationId } = req.params
    const userId = req.user.userId

    // TODO: Implement participant retrieval
    // Verify user has access to this consultation
    // Return participant list

    res.json([])
  } catch (error) {
    console.error('Get participants error:', error)
    res.status(500).json({ message: 'Error fetching participants' })
  }
})

// Create group conversation
router.post('/group', auth, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ message: 'Group name and at least 2 members required' });
    }
    const conversation = new Conversation({
      name,
      members,
      isGroup: true,
      createdBy: req.user.userId
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Error creating group' });
  }
});

// List user conversations (including groups)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Conversation.find({ members: userId })
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ message: 'Error listing conversations' });
  }
});

// Add member to group
router.post('/group/:id/add', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!conversation.members.includes(memberId)) {
      conversation.members.push(memberId);
      await conversation.save();
    }
    res.json(conversation);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Error adding member' });
  }
});

// Remove member from group
router.post('/group/:id/remove', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    conversation.members = conversation.members.filter(m => m.toString() !== memberId);
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Error removing member' });
  }
});

// Send group message
router.post('/:conversationId/group-message', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const from = req.user.userId;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const chatMessage = new ChatMessage({
      conversationId,
      from,
      message,
      isGroup: true
    });
    await chatMessage.save();
    await chatMessage.populate('from', 'name');
    res.json(chatMessage);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ message: 'Error sending group message' });
  }
});

// Update group avatar
router.post('/group/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No avatar uploaded' });
    const avatarUrl = `/uploads/chat/${req.file.filename}`;
    const conversation = await Conversation.findByIdAndUpdate(id, { groupAvatar: avatarUrl }, { new: true });
    res.json(conversation);
  } catch (error) {
    console.error('Update group avatar error:', error);
    res.status(500).json({ message: 'Error updating group avatar' });
  }
});

// Add admin to group
router.post('/group/:id/add-admin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!conversation.admin.includes(adminId)) {
      conversation.admin.push(adminId);
      await conversation.save();
    }
    res.json(conversation);
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ message: 'Error adding admin' });
  }
});

// Remove admin from group
router.post('/group/:id/remove-admin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    conversation.admin = conversation.admin.filter(a => a.toString() !== adminId);
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ message: 'Error removing admin' });
  }
});

module.exports = router 