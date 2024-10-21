export interface DirectMessage {
  id: number;
  content: string;
  senderId: number;
  recieverId: number;
  createdAt: Date;
  sender: { name: string };
  reciever: { name: string };
}

export interface Message {
  id: number;
  content: string;
  user?: {
    name: string;
  };
}