import { handle } from 'hono/vercel';
import app from '../../../src/app';

export const GET = handle(app);
export const OPTIONS = handle(app);
