'use client';

import { createTRPCReact } from '@trpc/react-query';

// Use any type to avoid build issues with tRPC router types
export const trpc = createTRPCReact<any>();