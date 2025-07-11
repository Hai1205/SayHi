import express from 'express';
import { PORT } from './utils/services/constants';
import cookieParser from 'cookie-parser';
import { userProxy } from './utils/configs/proxy';
import { connectRabbitMQ } from './utils/configs/rabbitmq';
import { acceptFormData, checkCORS, errorResponse, requestLogger } from './utils/services/middlewares';

const app = express();

app.use(checkCORS);

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(acceptFormData);

app.use(requestLogger);

app.use(errorResponse);

app.use("/api/chat", userProxy);

connectRabbitMQ();

app.listen(PORT, () => {
  console.log(`API Gateway Service running on port ${PORT}`);
});
