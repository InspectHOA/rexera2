import { z } from 'zod';
import { NOTIFICATION_TYPES, PRIORITY_LEVELS } from '../enums';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  priority: z.enum(PRIORITY_LEVELS),
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.any()).optional().nullable(),
  read: z.boolean(),
  read_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
});

export const NotificationFiltersSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  type: z.string().optional(),
  priority: z.string().optional(),
  read: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : []),
});

export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  created_at: true,
  read: true,
  read_at: true,
}).partial({
  metadata: true,
});

export const UpdateNotificationSchema = NotificationSchema.pick({
  read: true,
  read_at: true,
}).partial();

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationFilters = z.infer<typeof NotificationFiltersSchema>;
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;