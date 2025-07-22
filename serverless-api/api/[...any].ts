// Catch-all Vercel API entrypoint for Hono
import app, { GET, POST, PUT, PATCH, DELETE, OPTIONS } from '../src/app';

export { GET, POST, PUT, PATCH, DELETE, OPTIONS };
export default app;
