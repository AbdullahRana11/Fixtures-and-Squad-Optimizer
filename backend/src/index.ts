import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uclController from './controllers/ucl.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

app.post('/api/ucl/draw-match', uclController.drawMatch);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
