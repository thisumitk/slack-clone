interface MessageInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  handleTyping: () => void;
  sendMessage: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ message, setMessage, handleTyping, sendMessage }) => {
  return (
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
  );
};

export default MessageInput;