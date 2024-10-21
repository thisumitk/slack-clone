import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface DirectMessage {
  id: number;
  content: string;
  senderId: number;
  recieverId: number;
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
  recepientId? : number;
}

const Chat: React.FC<ChatProps> = ({ channelId, userId, recepientId }) => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const isDirectMessage = !!recepientId;

  useEffect(() => {
    if (session) {
      // Initialize WebSocket connection
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        ws.current = new WebSocket(`ws://localhost:8080`);

        ws.current.onopen = () => {
          console.log('WebSocket connection opened');
          if (isDirectMessage) {
            ws.current?.send(JSON.stringify({type : 'joinDirectMessage', recepientId}));
          }
          else ws.current?.send(JSON.stringify({ type: 'joinChannel', channelId }));
        };

        ws.current.onmessage = (event) => {
          try {
            const newMessage: Message = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onclose = () => {
          console.log('WebSocket connection closed. Attempting to reconnect...');
          setTimeout(() => {
            ws.current = new WebSocket(`ws://localhost:8080`);
          }, 1000);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      }

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [channelId, session, recepientId]);

  useEffect(() => {
    // Fetch messages when switching channels or DMs
    const fetchMessages = async () => {
      const endpoint = isDirectMessage
        ? `http://localhost:8080/api/direct-messages/${userId}/${recepientId}`
        : `http://localhost:8080/api/messages/${channelId}`;

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
  }, [channelId, recepientId, userId, isDirectMessage]);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = isDirectMessage
      ? {
        senderId : userId, 
        recieverId: recepientId, 
        content : message.trim(),
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
    } else {
      console.error('WebSocket is not open', ws.current?.readyState);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>You need to log in to access the chat.</div>;
  }

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>
              {isDirectMessage
                ? (msg as DirectMessage).senderId === userId
                  ? 'You'
                  : (msg as DirectMessage).sender?.name
                : msg.user?.name} :
            </strong>
             {msg.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage} disabled={!message.trim()}>
        Send
      </button>
    </div>
  );
};

export default Chat;