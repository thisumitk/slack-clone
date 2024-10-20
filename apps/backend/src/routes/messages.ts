import { Router, Request, Response } from 'express';
import prisma from '../prisma/client.js';

const router = Router();

router.get('/api/messages/:channelId', async (req : Request, res : Response) => {
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

router.post('/api/direct-messages', async (req: Request, res: Response) => {
  const { content, senderId, recieverId } = req.body;

  try {
    const newMessage = await prisma.directMessage.create({
      data: {
        content,
        senderId,
        recieverId,
      },
    });
    res.json(newMessage);
  } catch (error) {
    console.error(`Error creating direct message:`, error);
    res.status(500).json({ error: 'Failed to create direct message' });
  }
});


router.get('/api/direct-messages/:userId1/:userId2', async (req: Request, res: Response) => {
  const { userId1, userId2 } = req.params;

  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: Number(userId1), recieverId: Number(userId2) },
          { senderId: Number(userId2), recieverId: Number(userId1) },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender : true,
        receiver : true,
      }
    });
    res.json(messages);
  } catch (error) {
    console.error(`Error fetching direct messages:`, error);
    res.status(500).json({ error: 'Failed to fetch direct messages' });
  }
});


export default router;
