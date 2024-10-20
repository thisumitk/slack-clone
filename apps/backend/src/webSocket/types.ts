export type MessagePayload = {
  userId: number;
  channelId: number;
  content: string;
};

export type DirectMessagePayload = {
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
  recepientId: number;
};

export type WebSocketWithInput = WebSocket & {
  channelId?: number;
  recieverId?: number;
};

export type WebSocketMessage = MessagePayload | DirectMessagePayload | JoinChannelPayload | JoinDirectMessagePayload;
