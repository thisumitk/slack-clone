export type MessagePayload = {
  type: 'message';
  userId: number;
  channelId: number;
  content: string;
};

export type DirectMessagePayload = {
  type: 'directMessage';
  senderId: number;
  recieverId: number;
  content: string;
};

export type JoinChannelPayload = {
  type: 'joinChannel';
  channelId: number;
};

export type JoinDirectMessagePayload = {
  type: 'joinDirectMessage';
  recipientId: number;
};

export type WebSocketWithInput = WebSocket & {
  channelId?: number;
  receiverId?: number;
};

export type WebSocketMessage = MessagePayload | DirectMessagePayload | JoinChannelPayload | JoinDirectMessagePayload 
| { type: 'userOnline'; userId: number }
| { type: 'userOffline'; userId: number }
| { type: 'typing'; userId: number; channelId: number }
| { type: 'stopTyping'; userId: number; channelId: number }
