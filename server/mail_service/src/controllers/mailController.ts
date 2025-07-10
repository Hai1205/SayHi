import { EMAIL_PASS, EMAIL_USER } from "../utils/services/constants.js";
import nodemailer from 'nodemailer';

export const sendMail = async (data: { to: string; subject: string; body: string }) => {
  try {
    const { to, subject, body } = data;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    const mailOptions = {
      from: "Say Hi <sayhi@gmail.com>",
      to,
      subject,
      body
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      status: 200,
      message: "Email sent successfully"
    };
  } catch (error) {
    console.error('Error in sendMail:', error);
    return {
      success: false,
      status: 500,
      message: "Internal server error"
    };
  }
};