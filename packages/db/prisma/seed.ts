import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const password1 = await bcrypt.hash('Password1.', 10);
  const password2 = await bcrypt.hash('Password2.', 10);

  // Upsert users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {
      password: password1,
      name: 'User One',
    },
    create: {
      email: 'user1@example.com',
      password: password1,
      name: 'User One',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {
      password: password2,
      name: 'User Two',
    },
    create: {
      email: 'user2@example.com',
      password: password2,
      name: 'User Two',
    },
  });

  // Create or retrieve channels
  const channels = await Promise.all([
    prisma.channel.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'General',
      },
    }),
    prisma.channel.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Tech',
      },
    }),
  ]);

  // Create messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Hello everyone!',
        userId: user1.id,
        channelId: channels[0].id, // General channel
      },
      {
        content: 'Welcome to the General channel!',
        userId: user2.id,
        channelId: channels[0].id, // General channel
      },
      {
        content: 'What’s the latest in tech?',
        userId: user1.id,
        channelId: channels[1].id, // Tech channel
      },
    ],
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
