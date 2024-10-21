interface TypingIndicatorProps {
  typingUsers: number[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="text-sm text-gray-500 italic">
      {`is typing...`}
    </div>
  );
};

export default TypingIndicator;