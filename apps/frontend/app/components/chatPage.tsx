"use client"
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import ChannelManager from './createChannel';
import Chat from './Chat';
import UserSelector from './userSelector';

interface ChatPageProps {
  userId: number;
}
const ChatPage: React.FC<ChatPageProps>= ({ userId }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [selectedUserId,  setSelectedUserId] = useState<number | null>(null);
  const { data: session, status } = useSession();

  const handleChannelSelect = (channelId: number) => {
    setSelectedChannelId(channelId);
    setSelectedUserId(null);
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setSelectedChannelId(null);
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
        <UserSelector onUserSelect={handleUserSelect} /> {/* Add UserSelector */}
      </div>
      <div className="w-3/4">
        {selectedChannelId ? (
          <Chat channelId={selectedChannelId} userId={userId} />
        ) : selectedUserId ? (
          <Chat channelId={null} userId={userId} recepientId={selectedUserId} /> // Pass recipientId for DM
        ) : (
          <div>Select a channel or user to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;