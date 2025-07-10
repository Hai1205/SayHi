import amqp from 'amqplib';
import { AUTH_QUEUE, CHAT_QUEUE, MAIL_QUEUE, RABBITMQ_URL, USER_QUEUE } from '../services/constants.js';
import { registerUser, loginUser, resendOTP, verifyOTP, logoutUser } from '../../controllers/authController.js';
import { getUserById } from '../../controllers/userController.js';
import { v4 as uuid } from 'uuid';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    for (const queue of QUEUES) {
      await setupQueueConsumer(channel, queue.name, queue.handlers, queue.durable);
    }

    console.log('✅ Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('❌ Error connecting to RabbitMQ:', error);
    throw error;
  }
};

const QUEUES = [
  {
    name: AUTH_QUEUE,
    durable: false,
    handlers: {
      get_user_by_id: getUserById,
      register: registerUser,
      login: loginUser,
      verify_otp: verifyOTP,
      resend_otp: resendOTP,
      logout: logoutUser,
    },
  },
  {
    name: CHAT_QUEUE,
    durable: false,
    handlers: {
      get_user_by_id: getUserById,
    },
  },
  {
    name: MAIL_QUEUE,
    durable: false,
    handlers: {},
  },
  {
    name: USER_QUEUE,
    durable: false,
    handlers: {},
  },
];

export const setupQueueConsumer = async (
  channel: amqp.Channel,
  queueName: string,
  handlers: any,
  durable: boolean = true
) => {
  await channel.assertQueue(queueName, { durable });

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      const { action, data } = content;

      const handler = handlers[action];
      let response;

      if (handler) {
        response = await handler(data);
      } else {
        response = { error: `Unknown action: ${action}` };
      }

      if (msg.properties.replyTo) {
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          { correlationId: msg.properties.correlationId }
        );
      }

      channel.ack(msg);
    } catch (error) {
      console.error(`Error processing message for queue ${queueName}:`, error);
      channel.nack(msg, false, false);
    }
  });

  console.log(`[*] Listening on queue: ${queueName}`);
};

export const sendMessageAndWaitResponse = async (queue: string, message: any) => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  return new Promise(async (resolve, reject) => {
    try {
      const replyQueue = await channel.assertQueue('', { exclusive: true });
      const correlationId = uuid();

      const { consumerTag } = await channel.consume(
        replyQueue.queue,
        (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            const content = JSON.parse(msg.content.toString());
            resolve(content);
            channel.cancel(consumerTag); // 👈 huỷ
          }
        },
        { noAck: true }
      );

      channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        {
          correlationId: correlationId,
          replyTo: replyQueue.queue,
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};
