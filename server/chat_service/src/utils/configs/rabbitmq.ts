import amqp from 'amqplib';
import { RABBITMQ_URL, AUTH_QUEUE, USER_QUEUE, MAIL_QUEUE } from '../services/constants.js';
import { registerUser, loginUser, resendOTP, verifyOTP, logoutUser } from '../../controllers/chatController.js';
import { v4 as uuidv4 } from 'uuid';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(AUTH_QUEUE, { durable: false });
        await channel.assertQueue(USER_QUEUE, { durable: false });
        await channel.assertQueue(MAIL_QUEUE, { durable: false });

        await setupAuthQueueConsumer();
        await setupUserQueueConsumer();

        console.log('✅ Connected to RabbitMQ');

        return channel;
    } catch (error) {
        console.error('❌ Error connecting to RabbitMQ:', error);
        throw error;
    }
};

const setupAuthQueueConsumer = async () => {
    channel.consume(AUTH_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString());
            const { action, data } = content;
            let response;

            switch (action) {
                case 'register':
                    response = await registerUser(data);
                    break;
                case 'login':
                    response = await loginUser(data);
                    break;
                case 'verify_otp':
                    response = await verifyOTP(data);
                    break;
                case 'resend_otp':
                    response = await resendOTP(data);
                    break;
                case 'logout':
                    response = await logoutUser(data);
                    break;
                default:
                    response = { error: 'Unknown action' };
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
            console.error('Error processing auth message:', error);
            channel.nack(msg, false, false);
        }
    });
};

const setupUserQueueConsumer = async () => {
    channel.consume(USER_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString());
            const { action, data } = content;
            let response;

            if (msg.properties.replyTo) {
                channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify(response || { success: true })),
                    { correlationId: msg.properties.correlationId }
                );
            }

            channel.ack(msg);
        } catch (error) {
            console.error('Error processing user message:', error);
            channel.nack(msg, false, false);
        }
    });
};

export const sendMessageAndWaitResponse = async (queue: string, message: any) => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized');
    }

    return new Promise((resolve, reject) => {
        channel.assertQueue('', { exclusive: true }).then((replyQueue) => {
            const correlationId = uuidv4();

            channel.consume(replyQueue.queue, (msg) => {
                if (msg && msg.properties.correlationId === correlationId) {
                    const content = JSON.parse(msg.content.toString());
                    resolve(content);
                }
            }, { noAck: true });

            channel.sendToQueue(queue,
                Buffer.from(JSON.stringify(message)),
                {
                    correlationId: correlationId,
                    replyTo: replyQueue.queue
                }
            );
        }).catch(err => reject(err));
    });
};