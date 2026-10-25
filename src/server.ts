import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './database/db';
import agentRoutes from './routes/agentRoutes';
import biddingRoutes from './routes/biddingRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
app.use(cors());
app.use(express.json());
app.set('io', io);
app.use('/api/agent', agentRoutes);
app.use('/api/bids', biddingRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'healthy', database: 'connected', timestamp: dbRes.rows[0].now });
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`CurbResale Backend running on port ${PORT}`); });

export default app;
