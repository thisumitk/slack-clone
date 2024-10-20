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
};

const broadcastToDirectMessage = (wss: WebSocketServer, recieverId: number, message: any) => {
    wss.clients.forEach(client => {
        const ws = client as WebSocketWithChannel;
        if (ws.readyState === WebSocket.OPEN && ws.recieverId === recieverId) {
            ws.send(JSON.stringify(message));
        }
    });
};

const broadcastToChannel = (wss: WebSocketServer, channelId: number, message: any) => {
    wss.clients.forEach(client => {
        const ws = client as WebSocketWithChannel;
        if (ws.readyState === WebSocket.OPEN && ws.channelId === channelId) {
            ws.send(JSON.stringify(message));
        }
    });
};

export const initializeWebSocket = (server : Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocketWithChannel) => {
        console.log(`Client Connected`);

        ws.on('message', async (data: string) => {
            try {
                const messageData: WebSocketMessage = JSON.parse(data);

                if ('type' in messageData) {
                    if (messageData.type === 'joinChannel') {
                        const joinChannelPayload = messageData as JoinChannelPayload;
                        ws.channelId = joinChannelPayload.channelId;
                        console.log(`User Joined The Channel: ${joinChannelPayload.channelId}`);
                    } else if (messageData.type === 'joinDirectMessage') {
                        const joinDirectMessagePayload = messageData as JoinDirectMessagePayload;
                        ws.recieverId = joinDirectMessagePayload.recepientId;
                        console.log(`User Joined Direct Message with ID: ${joinDirectMessagePayload.recepientId}`);
                    }
                }

                // Handle other message types
                if ('userId' in messageData) {
                    const { userId, channelId, content } = messageData as MessagePayload;
                    if (userId !== undefined) {
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
                console.error('Error processing message:', error);
                ws.send(JSON.stringify({ error: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            console.log(`Client Disconnected`);
            // Handle cleanup if needed
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    return wss;
};
