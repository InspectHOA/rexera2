/**
 * Next.js API types for serverless functions.
 */

import { IncomingMessage, ServerResponse } from 'http';

export interface NextApiRequest extends IncomingMessage {
  query: { [key: string]: string | string[] };
  body: any;
  method?: string;
}

export interface NextApiResponse<T = any> extends ServerResponse {
  status(statusCode: number): NextApiResponse<T>;
  json(body: T): void;
}