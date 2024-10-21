import React, { useEffect } from 'react';
import { DirectMessage, Message } from './types';

interface ChatMessageListProps {
  messages: Message[];
  userId: number;
  isDirectMessage: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, userId, isDirectMessage, chatContainerRef }) => {
  useEffect(() => {
    // Scroll to bottom when new message is added
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  return (
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-100 border-b border-gray-300">
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
  );
};

export default ChatMessageList;