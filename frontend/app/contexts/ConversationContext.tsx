"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "./AuthContext"
import { io, Socket } from "socket.io-client"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  audio?: string
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
  sendTextMessage: (message: Message) => Promise<void>
  transcribeAudio: (audioChunks: Blob[]) => Promise<string>
  isLoading: boolean
  error: string | null
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

// ConversationContext.tsx
// Context quản lý hội thoại: danh sách hội thoại, tin nhắn, gửi/nhận tin nhắn, socket, loading, error.
// Cung cấp các hàm: bắt đầu hội thoại mới, tải hội thoại, gửi tin nhắn, chuyển âm thanh thành text, ...

export function ConversationProvider({ children }: { children: ReactNode }) {
  // currentConversationId: id hội thoại hiện tại
  // currentConversationMessages: danh sách tin nhắn của hội thoại hiện tại
  // conversations: danh sách các hội thoại
  // isLoading: trạng thái loading
  // error: thông báo lỗi
  // socket: kết nối socket.io
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const [currentConversationMessages, setCurrentConversationMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  // Hàm streamText: mô phỏng hiệu ứng gõ từng từ cho AI trả lời
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

  // useEffect: Khởi tạo kết nối socket khi có user, lắng nghe sự kiện nhận tin nhắn mới
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
            let messageWithDisplay: Message = {
              ...newMessage,
              displayContent: '',
            };
            // If audio is an array, convert to Blob[]
            if (Array.isArray(newMessage.audio)) {
              messageWithDisplay.audio = newMessage.audio.map((b: any) => new Blob([new Uint8Array(b.data)], { type: 'audio/wav' }));
            }
            setCurrentConversationMessages(prev => [...prev, messageWithDisplay]);
            streamText(newMessage.id, newMessage.content);
            if (messageWithDisplay.audio && messageWithDisplay.role === "assistant") {
              playAudio(messageWithDisplay.audio as string);
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

  // Helper: chuyển Blob <-> base64 (nên dùng từ lib/utils)
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        if (typeof base64data === 'string') {
          // Remove the data:*/*;base64, part if needed
          const base64 = base64data.split(',')[1] || base64data;
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper: Convert base64 to Blob
  const base64ToBlob = (base64: string, type: string = 'audio/wav'): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };

  // Hàm loadAllConversations: tải tất cả hội thoại của user
  const loadAllConversations = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/conversation/all`, {
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
      setConversations(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm startNewConversation: bắt đầu hội thoại mới
  const startNewConversation = () => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    setCurrentConversationMessages([]);
    return newConversationId; // Return the new conversation ID
  };

  // Hàm loadConversation: tải tin nhắn của hội thoại theo id
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

  // Hàm sendTextMessage: gửi tin nhắn (có thể kèm audio base64)
  const sendTextMessage = async (message: Message) => {
    if (!user) {
      setError("User not authenticated");
      return;
    }
    try {
      const conversationId = currentConversationId || startNewConversation();
      let audioBase64 = undefined;
      if (message.audio && Array.isArray(message.audio)) {
        // Convert Blob[] to base64
        const mergedBlob = new Blob(message.audio, { type: 'audio/wav' });
        audioBase64 = await blobToBase64(mergedBlob);
      } else if (typeof message.audio === 'string') {
        audioBase64 = message.audio;
      }
      const messageToSend: Message = {
        ...message,
        audio: audioBase64,
      };
      setCurrentConversationMessages((prev) => [...prev, messageToSend]);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          conversationid: conversationId,
          messages: [messageToSend],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      // console.log('Message sent successfully');
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    }
  };

  // Hàm transcribeAudio: gửi audio lên server để chuyển thành text
  const transcribeAudio = async (audioChunks: Blob[]) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      audioChunks.forEach((chunk, index) => {
        formData.append(`chunk_${index}`, chunk);
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }
      const { text } = await response.json();
      return text;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm playAudio: phát audio từ base64
  const playAudio = (audioData: string) => {
    if (!audioData || audioData.length === 0) return

    const audioBlob = base64ToBlob(audioData, "audio/wav")
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    audio.play()
  }

  // Hàm sendVoiceRecording: gửi bản ghi âm, nhận transcript, gửi lại như tin nhắn
  const sendVoiceRecording = async (message: Message) => {
    if (!user) return;

    setIsLoading(true)
    setError(null)

    try {
      // Create form data with audio chunks
      const formData = new FormData()
      if (Array.isArray(message.audio)) {
        message.audio.forEach((chunk: Blob, index: number) => {
          formData.append(`chunk_${index}`, chunk)
        })
      }

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

      // Cập nhật lại message với transcript
      const updatedMessage: Message = {
        ...message,
        content: text,
      }

      setCurrentConversationMessages((prev) => [...prev, updatedMessage]);
      
      // Send the transcribed text as a message (with audio as Blob[])
      await sendTextMessage(updatedMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
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
        transcribeAudio,
        isLoading,
        error,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

// Hook sử dụng ConversationContext trong các component
export function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error("useConversation must be used within a ConversationProvider")
  }
  return context
}
