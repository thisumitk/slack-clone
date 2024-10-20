import express from 'express';
import http from 'http';
import cors from 'cors';
import { initializeWebSocket } from './ws/wsHandler';

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(express.json());

const server = http.createServer(app);
const wss = initializeWebSocket(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { NextApiRequest } from 'next';
import { parse } from 'url';
import http from 'http';
import cors from 'cors';


const app = express()
app.use(cors({
  origin: 'http://localhost:3000', // Change this to your front-end origin
  // credentials: true, // Allow cookies to be sent
}));
app.use(express.json());

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const prisma = new PrismaClient();

const getTokenFromUrl = (req: NextApiRequest) : string | null => {

  const parsedUrl = parse(req.url || '', true);
  return parsedUrl.query.token as string | null;
};

type MesagePayload = {

  userId: number;
  channelId : number;
  content : string;
}
type DirectMessagePayload = {
  senderId: number;
  recieverId: number;
  content: string;
};

type JoinDirectMessagePayload = {
  type: 'joinDirectMessage';
  re: number;
};


type WebSocketWithChannel = WebSocket & {
    channelId? : Number;
    recieverId? : Number;
}

function broadcastToDirectMessage(recieverId: number, message: any) {
  wss.clients.forEach(client => {
    const ws = client as WebSocketWithChannel;
    if (ws.readyState === WebSocket.OPEN && ws.recieverId === recieverId) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToCHannel(channelId : number, message : any){

  wss.clients.forEach(client => {
    const ws = client as WebSocketWithChannel;
    if (ws.readyState === WebSocket.OPEN && ws.channelId === channelId ){

      ws.send(JSON.stringify(message));
    }
  });
};

wss.on('connection', async function connection(ws : WebSocketWithChannel, req : NextApiRequest) {
  /* const token = getTokenFromUrl(req);

  if (!token){
    ws.close(4001, `AUthentication required`);
    return
  }

  const session = await getSession({req});

  if(!session){

    ws.close(4001, `Invalid Session`);
    return;
  }

  console.log('AUthenticated user:', session.user?.email);
*/
  ws.on('error', console.error);

  console.log(`Client Connected`);

  ws.on('message', async function message(data : string) {
      console.log('Received data:', data);
      const messageData : MesagePayload | { type: string; channelId: number } | DirectMessagePayload | JoinDirectMessagePayload = JSON.parse(data);

      if ('type' in messageData && messageData.type === 'joinChannel') {
        ws.channelId = messageData.channelId;
        console.log(`User Joined The Channel: ${messageData.channelId}`);
        return; // Exit this handler after processing joinChannel
    }

    if ('type' in messageData && messageData.type === 'joinDirectMessage') {
      
      console.log(`User Joined Direct Message with ID:`);
      return; // Exit this handler after processing joinDirectMessage
    }

    if ('userId' in messageData){
      const { userId, channelId, content } = messageData;
    
      try {

        if (userId === undefined) {
          console.error('User ID is undefined');
          return; // Exit early to avoid trying to save the message
      }
      

        const newMessage = await prisma.message.create({

          data : {

            content,
            userId,
            channelId
          },
          include: {
            user: true,
          }
        });

        broadcastToCHannel(channelId, newMessage);

      } catch(error){

        console.error(`Error Saving the message :`, error);
      }
  }

  if ('senderId' in messageData && 'recieverId' in messageData){

    const { senderId, recieverId, content} = messageData;

    try {
      if ( senderId === undefined || recieverId === undefined){
        console.error(`sender Id or reciever ID is undefined`);
      }
      const newDirectMessage = await prisma.directMessage.create({
        data : {
          content,
          senderId,
          recieverId,
        },
      });

      broadcastToDirectMessage(recieverId, newDirectMessage);
    } catch(error){
      console.error(`Failed to broadcast the message`)
    };
  }
});

 ws.on(`joinChannel`, function joinCHannel (channelId : number){

    ws.channelId = channelId;
    console.log(`User Joined The CHannel : ${channelId}`);
  });
 ws.on('joinDirectMessage', function joinMessage(recepientId:number) {
  ws.recieverId = recepientId;
  console.log(`User Joined the DM with : ${recepientId}`)
 }) 
});