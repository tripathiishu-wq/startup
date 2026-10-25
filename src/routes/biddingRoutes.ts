import { Router } from 'express';
import { pool } from '../database/db';

const router = Router();

router.post('/', async (req, res) => {
  const { vehicleId, buyerId, amount } = req.body;
  const io = req.app.get('io');

  try {
    const bidRes = await pool.query(
      'INSERT INTO bids (vehicle_id, buyer_id, amount, status) VALUES ($1, $2, $3, \'active\') RETURNING *',
      [vehicleId, buyerId, amount]
    );
    const newBid = bidRes.rows[0];

    // Safely emit only if socket.io is initialized
    if (io) {
      io.to(`vehicle_${vehicleId}`).emit('new_bid', newBid);
    }

    res.status(200).json({
      success: true,
      message: 'Bid placed successfully!',
      bid: newBid
    });
  } catch (error: any) {
    console.error('Bid error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const bids = await pool.query(
      'SELECT * FROM bids WHERE vehicle_id = $1 ORDER BY amount DESC',
      [vehicleId]
    );
    res.status(200).json({ success: true, bids: bids.rows });
  } catch (error: any) {
    console.error('Fetch bids error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
