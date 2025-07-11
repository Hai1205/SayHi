import express from 'express';
import { PORT } from './utils/services/constants.js';
import connectDatabase from './utils/configs/database.js';
import { connectRabbitMQ } from './utils/configs/rabbitmq.js';

const app = express();

connectDatabase();

connectRabbitMQ();

app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT}`);
});
