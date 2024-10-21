export interface DirectMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: Date;
  sender: { name: string };
  receiver: { name: string };
}

export interface Message {
  id: number;
  content: string;
  user?: {
    name: string;
  };
}