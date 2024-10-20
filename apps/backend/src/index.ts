import express from 'express';
import http from 'http';
import channelsRouter from './routes/channels.js';
import messagesRouter from './routes/messages.js';
import usersRouter from './routes/users.js';
import cors from 'cors';
import { initializeWebSocket } from './webSocket/index.js';

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(express.json());
app.use('/', channelsRouter);
app.use('/', messagesRouter);
app.use('/', usersRouter);


const server = http.createServer(app);
const wss = initializeWebSocket(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
