import express from 'express';
import cors from 'cors';
import buildRouter from './routes/build';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.use('/api/build', buildRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'NORA AI Builder API' });
});

app.listen(PORT, () => {
  console.log(`NORA AI Builder backend running on http://localhost:${PORT}`);
});
