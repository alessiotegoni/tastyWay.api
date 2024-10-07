import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY!;

export const stripe = new Stripe(secretKey, { typescript: true });
