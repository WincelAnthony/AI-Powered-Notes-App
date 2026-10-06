import pg from 'pg';
import { config } from '../config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Always pass user input through `params` ($1, $2...) -- never string-concatenate it into SQL.
export const query = (text, params) => pool.query(text, params);
