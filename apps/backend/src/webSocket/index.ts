import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import prisma from '../prisma/client.js';
import {
    WebSocketMessage,
    JoinChannelPayload,
    JoinDirectMessagePayload,
    MessagePayload,
    DirectMessagePayload
} from './types.js';

type WebSocketWithChannel = WebSocket & {
    channelId?: number;
    recieverId?: number;
    userId?: number;
};

const onlineUsers = new Set<number>();
const typingUsers = new Map<number, Set<number>>();

const broadcastToChannel = (wss: WebSocketServer, channelId: number, message: any) => {
    wss.clients.forEach(client => {
      const ws = client as WebSocketWithChannel;
      if (ws.readyState === WebSocket.OPEN && ws.channelId === channelId) {
        ws.send(JSON.stringify(message));
      }
    });
  };
  
  const broadcastToDirectMessage = (wss: WebSocketServer, recieverId: number, message: any) => {
    wss.clients.forEach(client => {
      const ws = client as WebSocketWithChannel;
      if (ws.readyState === WebSocket.OPEN && ws.recieverId === recieverId) {
        ws.send(JSON.stringify(message));
      }
    });
  };

const broadcastOnlineStatus = (wss: WebSocketServer) => {
    const onlineStatusMessage = {
      type: 'onlineStatus',
      onlineUsers: Array.from(onlineUsers)
    };
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(onlineStatusMessage));
      }
    });
  };

  const broadcastTypingStatus = (wss: WebSocketServer, channelId?: number, recieverId?: number) => {
    if (channelId !== undefined || recieverId !== undefined) {
      const id = channelId ?? recieverId;
      if (id !== undefined) {
        const typingUsersSet = typingUsers.get(id) ?? new Set();
  
        const typingStatusMessage = {
          type: 'typingStatus',
          channelId: channelId,
          typingUsers: Array.from(typingUsersSet),
        };
  
        if (channelId !== undefined) {
          broadcastToChannel(wss, channelId, typingStatusMessage);
        } else if (recieverId !== undefined) {
          broadcastToDirectMessage(wss, recieverId, typingStatusMessage);
        }
      }
    }
  };
  

export const initializeWebSocket = (server : Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocketWithChannel) => {
        console.log(`Client Connected`);

        ws.on('message', async (data: string) => {
            try {
                const messageData: WebSocketMessage = JSON.parse(data);

                
                if ('type' in messageData) {
                    switch (messageData.type) {
                        case 'joinChannel' :
                        const joinChannelPayload = messageData as JoinChannelPayload;
                        ws.channelId = joinChannelPayload.channelId;
                        console.log(`User Joined The Channel: ${joinChannelPayload.channelId}`);
                        
                        break;
                        case 'joinDirectMessage' :
                        const joinDirectMessagePayload = messageData as JoinDirectMessagePayload;
                        ws.recieverId = joinDirectMessagePayload.recipientId;
                        console.log(joinDirectMessagePayload);
                        console.log(`User Joined Direct Message with ID: ${joinDirectMessagePayload.recipientId}`);
                    
                        break;
                        case 'userOnline' :
                            if (ws.userId) {
                                ws.userId = messageData.userId;
                                onlineUsers.add(ws.userId);
                                console.log(`${ws.userId} is online`);
                                broadcastOnlineStatus(wss);
                              }
                              break; 
                        case 'userOffline' :
                            if (ws.userId) {
                                console.log(`${ws.userId} is offline`);
                                onlineUsers.delete(ws.userId);
                                broadcastOnlineStatus(wss);
                              }
                              break;
                        case 'typing' :
                            if (ws.userId && ws.channelId) {
                                if (!typingUsers.has(ws.channelId)) {
                                  typingUsers.set(ws.channelId, new Set());
                                }
                                typingUsers.get(ws.channelId)!.add(ws.userId);
                                console.log(`isTyping`);
                                broadcastTypingStatus(wss, ws.channelId);
                              }
                              break;
                        case 'stopTyping' : 
                                if (ws.userId && ws.channelId) {
                                typingUsers.get(ws.channelId)?.delete(ws.userId);
                                console.log(`StopTyping`);
                                broadcastTypingStatus(wss, ws.channelId);
                                }
                                break;
                        
                }
            }

                if ('userId' in messageData && 'channelId' in messageData) {
                    const { userId, channelId, content } = messageData as MessagePayload;
                    if (userId !== undefined && content !== undefined) {
                        const newMessage = await prisma.message.create({
                            data: { content, userId, channelId },
                            include: { user: true },
                        });
                        broadcastToChannel(wss as WebSocketServer, channelId, newMessage);
                    }
                }

                if ('senderId' in messageData && 'recieverId' in messageData) {
                    const { senderId, recieverId, content } = messageData as DirectMessagePayload;
                    if (senderId !== undefined && recieverId !== undefined) {
                        const newDirectMessage = await prisma.directMessage.create({
                            data: { content, senderId, recieverId },
                        });
                        broadcastToDirectMessage(wss as WebSocketServer, recieverId, newDirectMessage);
                    }
                }
            } catch (error) {
                console.error('Error processing message while in :');
                ws.send(JSON.stringify({ error: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            console.log(`Client Disconnected`);
            if (ws.userId) {
                onlineUsers.delete(ws.userId);
                typingUsers.forEach((users, channelId) => {
                  if (users.delete(ws.userId!)) {
                    broadcastTypingStatus(wss, channelId);
                  }
                });
                broadcastOnlineStatus(wss);
              }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    return wss;
};
