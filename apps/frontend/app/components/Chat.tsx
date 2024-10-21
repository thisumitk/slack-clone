import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface DirectMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: Date;
  sender: { name: string };
  receiver: { name: string };
}

interface Message {
  id: number;
  content: string;
  user?: {
    name: string;
  };
}

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
        console.log(`UserId : ${userId} , RecepientId : ${recipientId} `)
        ws.current.send(JSON.stringify({ type: 'joinDirectMessage', recipientId, userId }));
      } else if (channelId !== null) {
        ws.current.send(JSON.stringify({ type: 'joinChannel', channelId, userId }));
      }
    }
  }, [channelId, recipientId, userId, isDirectMessage]);

  useEffect(() => {
     /* let retryTimeout : NodeJS.Timeout | null = null;
      const maxTries = 10;
      let retryCount = 0; */

      const connectWebSocket = () => {
        
        ws.current = new WebSocket(`wss://backend-empty-dawn-4144.fly.dev`);

        ws.current.onopen = () => {
          console.log('WebSocket connection opened');
          
          // retryCount = 0;
          
          joinRoom();
          ws.current?.send(JSON.stringify({ type: 'userOnline', userId }));
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'onlineStatus') {
              setOnlineUsers(data.onlineUsers);
            } else if (data.type === 'typingStatus') {
              setTypingUsers(data.typingUsers);
            } else {
              setMessages((prevMessages) => [...prevMessages, data]);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        /*ws.current.onclose = () => {
          console.log('WebSocket connection closed. Attempting to reconnect...');
          if ( retryCount < maxTries){
            retryCount++;
            retryTimeout = setTimeout(connectWebSocket, 1000*retryCount);
          }
        }; */

          ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      };

      connectWebSocket();

      return () => {
        // if(retryTimeout) clearTimeout(retryTimeout);
        if (ws.current) {
          ws.current.close();
        }
      };
  }, [channelId, session, recipientId, userId, joinRoom]);

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

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = isDirectMessage
        ? {
            senderId: userId,
            receiverId: recipientId,
            content: message.trim(),
          }
        : {
            userId,
            channelId,
            content: message.trim(),
          };

      if (!messageData.content) {
        console.error('Content is missing from message data:', messageData);
        return;
      }

      ws.current.send(JSON.stringify(messageData));
      setMessage('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      ws.current.send(JSON.stringify({ type: 'stopTyping', userId, channelId }));
    } else {
      console.error('WebSocket is not open', ws.current?.readyState);
    }
  };

  const handleTyping = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      if (!typingTimeoutRef){
      ws.current.send(JSON.stringify({ type: 'typing', userId, channelId }));
    }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        ws.current?.send(JSON.stringify({ type: 'stopTyping', userId, channelId }));
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  useEffect(() => {
    // Scroll to bottom when new message is added
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'stopTyping', userId, channelId }));
      }
    };
  }, [channelId, userId]);


  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>You need to log in to access the chat.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-100 border-b border-gray-300"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <strong className="text-blue-600">
              {isDirectMessage
                ? (msg as DirectMessage).senderId === userId
                  ? 'You'
                  : (msg as DirectMessage).sender?.name
                : msg.user?.name}
              :
            </strong>{' '}
            {msg.content}
          </div>
        ))}
      </div>
      <div className="p-2 bg-white">
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-500 italic">
            { // typingUsers.length === 1
              //? 
              `is typing...`
              // : `${typingUsers.length} users are typing...`
              }
          </div>
        )}
        {isDirectMessage && (
          <div className="text-sm text-gray-500">
            {onlineUsers.includes(recipientId!) ? 'Online' : 'Offline'}
          </div>
        )}
      </div>
      <div className="flex p-2 bg-white border-t border-gray-300">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;