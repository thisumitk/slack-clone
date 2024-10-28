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
    try {
      const response = await fetch('https://backend-empty-dawn-4144.fly.dev/api/channels');
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const createChannel = async () => {
    if (!channelName.trim()) return;
    try {
      const response = await fetch('https://backend-empty-dawn-4144.fly.dev/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: channelName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to create channel');
      const newChannel = await response.json();
      setChannels((prev) => [...prev, newChannel]);
      setChannelName('');
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Channels</h3>
      <div className="mb-4">
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="New channel name"
          className="px-3 py-2 border rounded-md w-full focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={createChannel}
          disabled={!channelName.trim()}
          className="mt-2 px-3 py-2 bg-blue-600 text-white rounded-md w-full hover:bg-blue-500 disabled:bg-gray-400"
        >
          Create Channel
        </button>
      </div>
      <ul className="overflow-y-auto max-h-80">
        {channels.map((channel) => (
          <li
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className="cursor-pointer px-3 py-2 hover:bg-blue-100 rounded-md"
          >
            # {channel.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChannelManager;