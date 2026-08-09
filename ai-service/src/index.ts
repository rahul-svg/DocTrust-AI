import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'],
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'AI service running' });
});

app.use('/', routes);

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, () => {
  console.log(`AI service running on port ${PORT}`);
});

export default app;
