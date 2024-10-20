import React, { useState, useEffect } from 'react';

interface Channel {
  id: number;
  name: string;
}

interface ChannelManagerProps {
  onChannelSelect: (channelId: number) => void;
}

const ChannelManager: React.FC<ChannelManagerProps> = ({ onChannelSelect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelName, setChannelName] = useState<string>('');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const response = await fetch('http://localhost:8080/api/channels');
    const data = await response.json();
    setChannels(data);
  };

  const createChannel = async () => {
    if (!channelName) return;
    const response = await fetch('http://localhost:8080/api/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: channelName }),
    });
    const newChannel = await response.json();
    setChannels((prev) => [...prev, newChannel]);
    setChannelName('');
  };

  return (
    <div>
      <h3>Channels</h3>
      <input
        type="text"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        placeholder="Channel Name"
      />
      <button onClick={createChannel}>Create Channel</button>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id} onClick={() => onChannelSelect(channel.id)}>
            {channel.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChannelManager;
