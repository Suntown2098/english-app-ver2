"use client";

import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VideoTrack,
  VoiceAssistantControlBar,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";
import Image from "next/image";

// import { CustomMicButton } from "@/components/CustomMicButton";
import { Mic, MicOff, MoreVertical, Phone, Video, Search, MessageCircle, Bot, User } from "lucide-react";


interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  timestamp: string;
  avatar?: string;
  name?: string;
}

export default function Page() {
  const [room] = useState(new Room());

  const connectToRoom = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    await room.localParticipant.setMicrophoneEnabled(true);
  }, [room]);

  useEffect(() => {
    connectToRoom();
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room, connectToRoom]);

  return (
    <main data-lk-theme="default" className="h-screen w-screen bg-gradient-to-br from-sage-50 to-cream-100 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 h-full bg-kidgreen text-white flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center w-full gap-8">
          <div className="text-center">
            {/* <p className="text-xl font-extrabold font-display mb-4">Không còn học kiểu sách vở!</p> */}
            <p className="text-lg font-semibold font-display mb-20">Duobingo giúp bạn luyện nói, tra từ, dịch câu – đỉnh của chóp.</p>
          </div>
          <div className="w-full">
            <h3 className="text-xl font-bold font-display text-yellow-200 mb-4 flex gap-8">🌟 Tính năng nổi bật</h3>
            <ul className="space-y-4 text-md font-sm font-display">
              <li className="flex items-center gap-2"><span>🎙️</span>Voice Chat cực vui – Nói chuyện tự nhiên, luyện phản xạ siêu nhanh</li>
              <li className="flex items-center gap-2"><span>📚</span>Từ điển tích hợp – Tra từ siêu tiện, có phát âm chuẩn chỉnh</li>
              <li className="flex items-center gap-2"><span>🌍</span>Dịch siêu tốc – Dịch câu trong chớp mắt, không cần thoát app</li>
            </ul>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-cream-50/80 backdrop-blur-sm border-b border-sage-200/30 p-4 flex items-center justify-between flex-shrink-0">
          {/* You can add participant info and action icons here if desired */}
          <div className="flex items-center space-x-3">
            {/* Placeholder for avatar and name */}
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
                <Image src="/chat-icon.png" alt="Chat icon" width={48} height={48} />
            </div>
            {/* <div className="h-10 w-10 rounded-full bg-sage-200 flex items-center justify-center text-sage-700 font-bold">A</div> */}
            <div>
              <h2 className="font-system-ui font-bold text-2xl text-sage-900 text-black">DUOBINGO</h2>
              <p className="text-sm text-sage-600 text-black">Speak till die</p>
            </div>
          </div>
        </div>
        {/* Chat area and mic button */}
        <div className="flex-1 flex flex-col h-0">
          <RoomContext.Provider value={room}>
            <SimpleVoiceAssistant />
          </RoomContext.Provider>
        </div>
      </div>
    </main>
  );
}

function SimpleVoiceAssistant() {
  const { state: agentState } = useVoiceAssistant();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="flex flex-col items-center gap-4 h-full"
    >
      <div className="flex-1 w-full ">
        <TranscriptionView />
      </div>
      <div className="w-full">
        <CustomMicButton />
      </div>
      <RoomAudioRenderer />
      <NoAgentNotification state={agentState} />
    </motion.div>
  );
}


function CustomMicButton() {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

  const handleMicToggle = () => {
    if (localParticipant) {
      if (!isMicrophoneEnabled) {
        // Subscribe to user's microphone
        localParticipant.setMicrophoneEnabled(true);
      } else {
        // Unsubscribe from user's microphone
        localParticipant.setMicrophoneEnabled(false);
      }
    }
  };

  return (
    <div className="p-6 backdrop-blur-sm">
      <div className="flex justify-center">
        <button
          onClick={handleMicToggle}
          className={`bg-olive pointer-events-auto rounded-full p-4 shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-olive/50 text-3xl flex items-center justify-center hover:scale-110`}
          aria-label={isMicrophoneEnabled ? "Recording" : "Pausing"}
          style={{ position: "relative", bottom: 0 }}
        >
          { isMicrophoneEnabled ? (
            <Mic className="text-white" />
          ) : (
            <MicOff className="text-white" />
          )}
        
        </button>
      </div>


    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
