// components/ChannelList.tsx
"use client"
import { useState } from 'react';
import Chat from './Chat';
import React from 'react';

interface ChannelListProps {
  userId: number;
}

const ChannelList: React.FC<ChannelListProps> = ({ userId }) => {
  const [currentChannel, setCurrentChannel] = useState(1); // Default to channel 1

  return (
    <div>
      <div>
        <button onClick={() => setCurrentChannel(1)}>Channel 1</button>
        <button onClick={() => setCurrentChannel(2)}>Channel 2</button>
      </div>
      <Chat channelId={currentChannel} userId={userId} />
    </div>
  );
};

export default ChannelList;