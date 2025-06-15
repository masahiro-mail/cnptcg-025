import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/handlers';
import { RoomManager } from './game/roomManager';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://10.255.255.254:3000',
      'http://10.255.255.254:3001',
      'http://10.255.255.254:3002',
      'http://172.28.249.73:3000',
      'http://172.28.249.73:3001',
      'http://172.28.249.73:3002'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://10.255.255.254:3000',
    'http://10.255.255.254:3001',
    'http://10.255.255.254:3002',
    'http://172.28.249.73:3000',
    'http://172.28.249.73:3001',
    'http://172.28.249.73:3002'
  ],
  credentials: true
}));
app.use(express.json());

// Additional headers for multiple connections
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize room manager
const roomManager = new RoomManager();

// Setup socket handlers
setupSocketHandlers(io, roomManager);

const PORT = Number(process.env.PORT) || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`CNP-TCG Backend running on port ${PORT}`);
});