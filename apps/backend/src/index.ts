/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import http from 'http';
import channelsRouter from './routes/channels.js';
import messagesRouter from './routes/messages.js';
import usersRouter from './routes/users.js';
import cors from 'cors';
import { initializeWebSocket } from './webSocket/index.js';
import authMiddleware from './middlewares/authMiddleware.js';

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000'
      , 'https://slack-clone-frontend-iota.vercel.app'
      , 'https://slacko.thisumitk.com'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use('/api', authMiddleware);
app.use(express.json());
app.use('/', channelsRouter);
app.use('/', messagesRouter);
app.use('/', usersRouter);


const server = http.createServer(app);
const wss = initializeWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
