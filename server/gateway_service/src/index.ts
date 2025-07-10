import express from 'express';
import { PORT } from './utils/services/constants';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { userProxy } from './utils/configs/proxy';
import authRoute from './routes/authRoute';
import { connectRabbitMQ } from './utils/configs/rabbitmq';
import { acceptFormData, checkPublicRoute, requestLogger } from './utils/services/middlewares';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(acceptFormData);

app.use(requestLogger);

connectRabbitMQ();

app.use("/api/auth", authRoute);

app.use(checkPublicRoute);

app.use("/api/user", userProxy);

app.listen(PORT, () => {
  console.log(`API Gateway đang chạy trên cổng ${PORT}`);
});
