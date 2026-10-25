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
    res.status(200).json({
      success: true,
      message: 'Scan logged & agent commission credited successfully!',
      qrId,
      commission: commissionRes.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicle Onboarding: Links the car to the scanned sticker & commission
router.post('/vehicle', async (req, res) => {
  const { qrId, makeModel, year, expectedPrice, fuelType, transmission, photos } = req.body;
  try {
    const vehicleRes = await pool.query(
      `INSERT INTO vehicles (qr_id, make_model, year, expected_price, fuel_type, transmission, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        qrId,
        makeModel,
        parseInt(year, 10),
        parseFloat(expectedPrice),
        fuelType || 'Petrol',
        transmission || 'Manual',
        photos || []
      ]
    );
    const vehicle = vehicleRes.rows[0];

    // Link vehicle_id into agent_commissions
    await pool.query(
      'UPDATE agent_commissions SET vehicle_id = $1 WHERE qr_id = $2',
      [vehicle.id, qrId]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle registered and live for bidding!',
      vehicle
    });
  } catch (error: any) {
    console.error('Vehicle onboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
