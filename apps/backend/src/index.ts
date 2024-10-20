import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
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

type WebSocketWithChannel = WebSocket & {
    channelId? : Number;
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
      const messageData : MesagePayload | { type: string; channelId: number } = JSON.parse(data);

      if ('type' in messageData && messageData.type === 'joinChannel') {
        ws.channelId = messageData.channelId;
        console.log(`User Joined The Channel: ${messageData.channelId}`);
        return; // Exit this handler after processing joinChannel
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
});

 ws.on(`joinChannel`, function joinCHannel (channelId : number){

    ws.channelId = channelId;
    console.log(`User Joined The CHannel : ${channelId}`);
  });
});

app.get('/api/messages/:channelId', async (req : Request, res : Response) => {
  const { channelId } = req.params;
  try {
    /* const session = await getSession({ req });
    if (!session) {
      res.status(401).json({ error: 'Unauthorized: you must be logged in to access' });
      return;
    }
*/
    const messages = await prisma.message.findMany({
      where: { channelId: parseInt(channelId, 10) },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });

    res.json(messages);
  } catch (error) {
    console.error(`Error Fetching Messages`, error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/channels', async function ( req : Request, res: Response){

  const { name } = req.body;

  try {

    const newChannel = await prisma.channel.create({
      data: {name},
    })
    res.json(newChannel);
  } catch(error){

    console.error(`ERROR creating the channel`, error);
    res.status(500).json({error : `failed to create channel`});
  }
});


app.get(`/api/channels`, async function (req:Request, res:Response) {
  
  try {
    const channels = await prisma.channel.findMany();
    if(!channels || channels.length === 0){
      res.json({message : 'No Channels Found'});
    }
    else res.json(channels);
  } catch(error){

    console.error('Error fetching the channels', error);
    res.status(500).json({error : `failed to fetch channels`});
  }
});