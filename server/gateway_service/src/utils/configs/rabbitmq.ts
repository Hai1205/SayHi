import amqp from 'amqplib';
import { RABBITMQ_URL, AUTH_QUEUE, USER_QUEUE, MAIL_QUEUE } from '../services/constants';
import { v4 as uuidv4 } from 'uuid';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(AUTH_QUEUE, { durable: true });
        await channel.assertQueue(USER_QUEUE, { durable: true });
        await channel.assertQueue(MAIL_QUEUE, { durable: true });

        console.log('✅ Connected to RabbitMQ');

        return channel;
    } catch (error) {
        console.error('❌ Error connecting to RabbitMQ:', error);
        throw error;
    }
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