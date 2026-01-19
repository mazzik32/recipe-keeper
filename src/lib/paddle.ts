import { Environment, Paddle } from '@paddle/paddle-node-sdk';

if (!process.env.PADDLE_API_KEY) {
  console.error('PADDLE_API_KEY is missing. Please set it in your .env.local file.');
}

const isSandbox = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' || process.env.NODE_ENV !== 'production';

export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: isSandbox ? Environment.sandbox : Environment.production,
});
