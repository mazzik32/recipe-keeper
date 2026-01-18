import { Environment, Paddle } from '@paddle/paddle-node-sdk';

if (!process.env.PADDLE_API_KEY) {
  console.error('PADDLE_API_KEY is missing. Please set it in your .env.local file.');
}

export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NODE_ENV === 'production' ? Environment.production : Environment.sandbox,
});
