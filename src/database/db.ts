import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});
