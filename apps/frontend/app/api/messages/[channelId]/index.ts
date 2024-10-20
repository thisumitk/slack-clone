// src/pages/api/messages/[channelId].ts (Next.js API route)

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'You must be logged in to access this data.' });
  }

  const { channelId } = req.query;

  try {
    const messages = await prisma.message.findMany({
      where: { channelId: parseInt(channelId as string, 10) },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
      },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};