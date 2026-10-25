import { Router } from 'express';
import { pool } from '../database/db';
const router = Router();
router.post('/scan', async (req, res) => {
  const { serialNumber, agentId, latitude, longitude, plateNumber } = req.body;
  try {
    let qrRes = await pool.query('SELECT * FROM qr_stickers WHERE serial_number = $1', [serialNumber]);
    let qrId;
    if (qrRes.rows.length === 0) {
      const newQr = await pool.query(
        'INSERT INTO qr_stickers (serial_number, status, agent_id) VALUES ($1, \'active\', $2) RETURNING id',
        [serialNumber, agentId]
      );
      qrId = newQr.rows[0].id;
    } else {
      qrId = qrRes.rows[0].id;
      await pool.query('UPDATE qr_stickers SET status = \'active\', agent_id = $1 WHERE id = $2', [agentId, qrId]);
    }
    const commissionRes = await pool.query(
      'INSERT INTO agent_commissions (agent_id, qr_id, bounty_amount, status) VALUES ($1, $2, 500.00, \'pending\') RETURNING *',
      [agentId, qrId]
    );
    res.status(200).json({ success: true, message: 'Scan logged & agent commission credited successfully!', qrId, commission: commissionRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
