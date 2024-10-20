import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: number;
  content: string;
  user: {
    name: string;
  };
}

interface ChatProps {
  channelId: number;
  userId: number;
}

const Chat: React.FC<ChatProps> = ({ channelId, userId }) => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (session && channelId) {
      // Initialize WebSocket connection
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        ws.current = new WebSocket(`ws://localhost:8080`);

        ws.current.onopen = () => {
          console.log('WebSocket connection opened');
          ws.current?.send(JSON.stringify({ type: 'joinChannel', channelId }));
        };

        ws.current.onmessage = (event) => {
          try {
            const newMessage: Message = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            // Handle the error gracefully, e.g., show an error message to the user
          }
        };

        ws.current.onclose = () => {
          console.log('WebSocket connection closed. Attempting to reconnect...');
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      }

      // Fetch previous messages when switching channels
      fetch(`http://localhost:8080/api/messages/${channelId}`)
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch((error) => {
          console.error('Error fetching messages:', error);
          // Handle the error gracefully, e.g., show an error message to the user
        });

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [channelId, session]);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
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
            <strong>{msg.user.name}:</strong> {msg.content}
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