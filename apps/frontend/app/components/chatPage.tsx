/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import ChannelManager from './createChannel';
// import Chat from './Chat';
import Chat from './Chat'
import UserSelector from './userSelector'; // Ensure this component is imported if you plan to use it

interface ChatPageProps {
  userId: number;
  recipientId? : number;
}

const ChatPage: React.FC<ChatPageProps> = ({ userId }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data: session, status } = useSession();

  const handleChannelSelect = (channelId: number) => {
    setSelectedChannelId(channelId);
    setSelectedUserId(null); // Reset user selection
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setSelectedChannelId(null); // Reset channel selection when a user is selected
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>You need to log in to access the chat.</div>;
  }

  return (
    <div className="flex">
      <div className="w-1/4">
        <ChannelManager onChannelSelect={handleChannelSelect} />
        <UserSelector onUserSelect={handleUserSelect} /> {/* Render UserSelector if needed */}
      </div>
      <div className="w-3/4">
        {selectedChannelId ? (
          <Chat channelId={selectedChannelId} userId={userId} />
        ) : selectedUserId ? (
          <Chat recipientId={selectedUserId} userId={userId} /> // Use recepientId for DMs
        ) : (
          <div>Select a channel or a user to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;