import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ChatMessageList from './ChatMessageList';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';
import MessageInput from './MessageInput';
import { DirectMessage, Message } from './types';

interface ChatProps {
  channelId?: number | null;
  userId: number;
  recipientId?: number;
}

const Chat: React.FC<ChatProps> = ({ channelId, userId, recipientId }) => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const isDirectMessage = !!recipientId;
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const joinRoom = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      if (isDirectMessage) {
        ws.current.send(JSON.stringify({ type: 'joinDirectMessage', recipientId, userId }));
      } else if (channelId !== null) {
        ws.current.send(JSON.stringify({ type: 'joinChannel', channelId, userId }));
      }
    }
  }, [channelId, recipientId, userId, isDirectMessage]);

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket(`wss://backend-empty-dawn-4144.fly.dev`);
      ws.current.onopen = () => joinRoom();
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'onlineStatus') setOnlineUsers(data.onlineUsers);
        if (data.type === 'typingStatus') setTypingUsers(data.typingUsers);
        else setMessages((prevMessages) => [...prevMessages, data]);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [channelId, recipientId, userId, joinRoom]);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = isDirectMessage
        ? { senderId: userId, recieverId: recipientId, content: message.trim() }
        : { userId, channelId, content: message.trim() };

      ws.current.send(JSON.stringify(messageData));
      setMessage('');
      ws.current.send(JSON.stringify({ type: 'stopTyping', userId, channelId }));
    }
  };

  useEffect(() => {
    // Fetch messages when switching channels or DMs
    const fetchMessages = async () => {
      const endpoint = isDirectMessage
        ? `https://backend-empty-dawn-4144.fly.dev/api/direct-messages/${userId}/${recipientId}`
        : `https://backend-empty-dawn-4144.fly.dev/api/messages/${channelId}`;

      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [channelId, recipientId, userId, isDirectMessage]);


  const handleTyping = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'typing', userId, channelId }));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        ws.current?.send(JSON.stringify({ type: 'stopTyping', userId, channelId }));
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>You need to log in to access the chat.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList
        messages={messages}
        userId={userId}
        isDirectMessage={isDirectMessage}
        chatContainerRef={chatContainerRef}
      />
      <div className="p-2 bg-white">
        <TypingIndicator typingUsers={typingUsers} />
        {isDirectMessage && <OnlineStatus recipientId={recipientId} onlineUsers={onlineUsers} />}
      </div>
      <MessageInput
        message={message}
        setMessage={setMessage}
        handleTyping={handleTyping}
        sendMessage={sendMessage}
      />
    </div>
  );
};

export default Chat;