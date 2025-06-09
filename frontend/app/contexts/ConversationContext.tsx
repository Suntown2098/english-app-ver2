"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "./AuthContext"
import { io, Socket } from "socket.io-client"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  audio?: Blob[]
  create_time: string
  displayContent?: string
}

type Conversation = {
  conversationid: string
  timestamp: string
}

type ConversationContextType = {
  currentConversationId: string | null
  currentConversationMessages: Message[]
  conversations: Conversation[]
  startNewConversation: () => string
  loadConversation: (conversationId: string) => Promise<void>
  sendTextMessage: (content: string) => Promise<void>
  sendVoiceRecording: (audioChunks: Blob[]) => Promise<void>
  isLoading: boolean
  error: string | null
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [currentConversationMessages, setCurrentConversationMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  // Function to stream text word by word
  const streamText = (messageId: string, fullText: string) => {
    const words = fullText.split(' ');
    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        setCurrentConversationMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, displayContent: words.slice(0, currentIndex + 1).join(' ') }
              : msg
          )
        );
        currentIndex++;
      } else {
        clearInterval(streamInterval);
      }
    }, 50); // Adjust speed here (milliseconds per word)
  };

  // Initialize Socket.IO connection for receiving messages
  useEffect(() => {
    if (user) {
      console.log("Initializing Socket.IO connection...");
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:5000';
      console.log("Connecting to:", socketUrl);

      const socket = io(socketUrl, {
        transports: ['websocket'],
        auth: {
          token: user.token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: '/socket.io/',
      });

      socket.on('connect', () => {
        console.log("Socket.IO connection established");
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log("Socket.IO connection closed:", reason);
        setIsConnected(false);
        setError("Connection closed. Please refresh the page.");
      });

      socket.on('connect_error', (error) => {
        console.error("Socket.IO connection error:", error);
        setIsConnected(false);
        setError("Connection error. Please check your connection.");
      });

      // Handle incoming messages (both text and audio)
      socket.on('message', (data) => {
        try {
          if (data.conversationid && data.messages && data.messages.length > 0) {
            const newMessage = data.messages[0];
            
            // Add message to conversation with initial empty displayContent
            const messageWithDisplay: Message = {
              ...newMessage,
              displayContent: ''
            };
            
            setCurrentConversationMessages(prev => [...prev, messageWithDisplay]);

            // Start streaming the text
            streamText(newMessage.id, newMessage.content);

            // Play audio if available
            if (newMessage.audio && newMessage.role === "assistant") {
              const audioData = base64ToBlob(newMessage.audio, 'audio/wav');
              playAudio([audioData]);
            }
          }
        } catch (err) {
          console.error("Error processing Socket.IO message:", err);
        }
      });

      setSocket(socket);

      // Load all conversations
      loadAllConversations();

      return () => {
        console.log("Cleaning up Socket.IO connection...");
        socket.disconnect();
        setIsConnected(false);
      };
    }
  }, [user]);

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };

  const loadAllConversations = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ userid: user.userid }),
      })

      if (!response.ok) {
        throw new Error("Failed to load conversations")
      }

      const data = await response.json()
      console.log("data", data)
      setConversations(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = () => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    setCurrentConversationMessages([]);
    return newConversationId; // Return the new conversation ID
  };

  const loadConversation = async (conversationId: string) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load conversation")
      }

      const data = await response.json()
      setCurrentConversationId(conversationId)
      setCurrentConversationMessages(data.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const sendTextMessage = async (content: string) => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      // Create a new conversation if none exists and get the conversation ID
      const conversationId = currentConversationId || startNewConversation();

      const messageId = uuidv4();
      const timestamp = new Date().toISOString();

      const newMessage: Message = {
        id: messageId,
        role: "user",
        content,
        create_time: timestamp,
        displayContent: content
      };

      // Add message to local state
      setCurrentConversationMessages((prev) => [...prev, newMessage]);

      // Send message via HTTP POST
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          conversationid: conversationId,
          messages: [newMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      console.log('Message sent successfully');
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    }
  };

  const sendVoiceRecording = async (audioChunks: Blob[]) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Create form data with audio chunks
      const formData = new FormData()
      audioChunks.forEach((chunk, index) => {
        formData.append(`chunk_${index}`, chunk)
      })

      // Transcribe audio
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to transcribe audio")
      }

      const { text } = await response.json()

      // Send the transcribed text as a message
      await sendTextMessage(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = (audioData: Blob[]) => {
    if (!audioData || audioData.length === 0) return

    const audioBlob = new Blob(audioData, { type: "audio/wav" })
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    audio.play()
  }

  return (
    <ConversationContext.Provider
      value={{
        currentConversationId,
        currentConversationMessages,
        conversations,
        startNewConversation,
        loadConversation,
        sendTextMessage,
        sendVoiceRecording,
        isLoading,
        error,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error("useConversation must be used within a ConversationProvider")
  }
  return context
}
