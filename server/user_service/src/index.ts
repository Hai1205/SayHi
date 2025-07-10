import express from 'express';
import { PORT } from './utils/services/constants.js';
import connectDatabase from './utils/configs/database.js';
import userRoute from './routes/userRoute.js';
import { connectRabbitMQ } from './utils/configs/rabbitmq.js';
import { acceptFormdata } from './utils/services/middlewares.js';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(acceptFormdata);

connectDatabase();

connectRabbitMQ();

app.use("/api", userRoute);

app.listen(PORT, () => {
  console.log(`User Service on port ${PORT}`);
});
