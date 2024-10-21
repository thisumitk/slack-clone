interface OnlineStatusProps {
  recipientId: number | undefined;
  onlineUsers: number[];
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ recipientId, onlineUsers }) => {
  if (recipientId === undefined) return null;

  return (
    <div className="text-sm text-gray-500">
      {onlineUsers.includes(recipientId) ? 'Online' : 'Offline'}
    </div>
  );
};

export default OnlineStatus;