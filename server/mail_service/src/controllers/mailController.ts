import { EMAIL_PASS, EMAIL_USER } from "../utils/services/constants.js";
import nodemailer from 'nodemailer';
import { CustomHandler } from "../utils/services/custom.js";

export const sendMail = CustomHandler(async (data: { to: string; subject: string; body: string }) => {
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
});