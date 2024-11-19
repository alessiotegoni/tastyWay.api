import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.MAILTRAP_API_KEY!;

export const mailtrapClient = new MailtrapClient({ token });

export const sender = {
  email: "mailtrap@demomailtrap.com",
  name: "TastyWay",
};
