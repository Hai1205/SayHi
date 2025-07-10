import amqp from 'amqplib';
import { RABBITMQ_URL, AUTH_QUEUE, MAIL_QUEUE, USER_QUEUE } from '../services/constants.js';
import { sendMail } from '../../controllers/mailController.js';
import { v4 as uuidv4 } from 'uuid';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(AUTH_QUEUE, { durable: true });
        await channel.assertQueue(USER_QUEUE, { durable: true });
        await channel.assertQueue(MAIL_QUEUE, { durable: true });

        await setupMailQueueConsumer();
        
        console.log('✅ Connected to RabbitMQ');

        return channel;
    } catch (error) {
        console.error('❌ Error connecting to RabbitMQ:', error);
        throw error;
    }
};

const setupMailQueueConsumer = async () => {
    channel.consume(MAIL_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString());
            const { action, data } = content;
            let response;

            switch (action) {
                case 'send_mail':
                    response = await sendMail(data);
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