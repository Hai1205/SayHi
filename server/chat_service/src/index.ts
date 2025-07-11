import express from 'express';
import { PORT } from './utils/services/constants';
import connectDatabase from './utils/configs/database';
import { acceptFormdata, errorResponse } from './utils/services/middlewares';
import { connectRabbitMQ } from './utils/configs/rabbitmq';
import chatRoute from './routes/chatRoute';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(acceptFormdata);

app.use(errorResponse);

connectDatabase();

connectRabbitMQ();

app.use("/api", chatRoute);

app.listen(PORT, () => {
  console.log(`Chat Service on port ${PORT}`);
});
