import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, Users, MessageCircle, X } from 'lucide-react'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import toast from 'react-hot-toast'

const VideoCall = ({ consultationId, userRole, onClose }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const socketRef = useRef()
  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const peerRef = useRef()
  const localStreamRef = useRef()
  const screenStreamRef = useRef()

  // Initialize Socket.IO connection
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server')
      socketRef.current.emit('join-consultation', consultationId)
    })

    socketRef.current.on('user-joined', (data) => {
      console.log('User joined:', data)
      setParticipants(prev => [...prev, data])
      toast.success(`${data.name} joined the consultation`)
    })

    socketRef.current.on('user-left', (data) => {
      console.log('User left:', data)
      setParticipants(prev => prev.filter(p => p.id !== data.id))
      toast.info(`${data.name} left the consultation`)
    })

    socketRef.current.on('offer', handleOffer)
    socketRef.current.on('answer', handleAnswer)
    socketRef.current.on('ice-candidate', handleIceCandidate)
    socketRef.current.on('chat-message', handleChatMessage)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [consultationId])

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })

        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        setIsConnected(true)
        setIsLoading(false)

        // Notify other participants
        socketRef.current.emit('user-joined', {
          id: socketRef.current.id,
          name: userRole === 'lawyer' ? 'Lawyer' : 'Client',
          role: userRole
        })

      } catch (err) {
        console.error('Error accessing media devices:', err)
        setError('Unable to access camera/microphone. Please check permissions.')
        setIsLoading(false)
        toast.error('Camera/microphone access denied')
      }
    }

    initializeMedia()

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [userRole])

  const handleOffer = useCallback(async (data) => {
    try {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: localStreamRef.current
      })

      peer.on('signal', (signal) => {
        socketRef.current.emit('answer', {
          consultationId,
          answer: signal,
          to: data.from
        })
      })

      peer.on('stream', (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
      })

      peer.signal(data.offer)
      peerRef.current = peer
    } catch (err) {
      console.error('Error handling offer:', err)
      toast.error('Failed to establish connection')
    }
  }, [])

  const handleAnswer = useCallback((data) => {
    if (peerRef.current) {
      peerRef.current.signal(data.answer)
    }
  }, [])

  const handleIceCandidate = useCallback((data) => {
    if (peerRef.current) {
      peerRef.current.signal(data.candidate)
    }
  }, [])

  const handleChatMessage = useCallback((data) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: data.from,
      message: data.message,
      timestamp: data.timestamp
    }])
  }, [])

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })

        screenStreamRef.current = screenStream
        const videoTrack = screenStream.getVideoTracks()[0]

        if (localStreamRef.current) {
          const sender = peerRef.current?.getSenders().find(s => 
            s.track?.kind === 'video'
          )
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }

        setIsScreenSharing(true)
        toast.success('Screen sharing started')
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop())
        }

        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }

        if (peerRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          const sender = peerRef.current.getSenders().find(s => 
            s.track?.kind === 'video'
          )
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
          }
        }

        setIsScreenSharing(false)
        toast.success('Screen sharing stopped')
      }
    } catch (err) {
      console.error('Screen sharing error:', err)
      toast.error('Failed to toggle screen sharing')
    }
  }

  const sendChatMessage = (e) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    const messageData = {
      consultationId,
      message: chatMessage,
      from: socketRef.current.id
    }

    socketRef.current.emit('chat-message', messageData)
    setChatMessage('')
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerRef.current) {
      peerRef.current.destroy()
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    onClose()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing video call...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <span className="text-sm text-gray-300">
            Consultation ID: {consultationId}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {participants.length + 1} participants
          </span>
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex">
        {/* Main Video */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Establishing connection...</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-400">
                      {msg.sender === socketRef.current?.id ? 'You' : 'Other'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <Settings className="h-6 w-6" />
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoCall 