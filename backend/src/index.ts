import express from 'express';
import cors from 'cors';
import buildRouter from './routes/build';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/build', buildRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'NORA AI Builder API' });
});

app.listen(PORT, () => {
  console.log(`NORA AI Builder backend running on http://localhost:${PORT}`);
});
