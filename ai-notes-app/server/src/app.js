import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' })); // request size limit
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;
