/**
 * Activities endpoint for Vercel serverless function.
 * Handles activity tracking and audit trail.
 */

import { NextApiRequest, NextApiResponse } from '../types/next';
import { z } from 'zod';
import { createServerClient } from '../utils/database';

// Validation schemas
const getActivitiesSchema = z.object({
  workflow_id: z.string().optional(),
  activity_type: z.string().optional(),
  user_id: z.string().optional(),
  created_by: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

const createActivitySchema = z.object({
  workflow_id: z.string().optional(),
  activity_type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
  user_id: z.string().optional(),
  created_by: z.string()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient();

  try {
    if (req.method === 'GET') {
      // List activities
      const input = getActivitiesSchema.parse(req.query);

      let query = supabase
        .from('activities')
        .select('*', { count: 'exact' });

      // Apply filtering
      if (input.workflow_id) query = query.eq('workflow_id', input.workflow_id);
      if (input.activity_type) query = query.eq('activity_type', input.activity_type);
      if (input.user_id) query = query.eq('user_id', input.user_id);
      if (input.created_by) query = query.eq('created_by', input.created_by);

      // Apply pagination and ordering
      const offset = (input.page - 1) * input.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      const { data: activities, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / input.limit);

      return res.json({
        success: true,
        data: activities || [],
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      });

    } else if (req.method === 'POST') {
      // Create activity
      const input = createActivitySchema.parse(req.body);

      const { data: activity, error } = await supabase
        .from('activities')
        .insert({
          workflow_id: input.workflow_id,
          activity_type: input.activity_type,
          title: input.title,
          description: input.description,
          metadata: input.metadata,
          user_id: input.user_id,
          created_by: input.created_by,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create activity: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        data: activity
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error: any) {
    console.error('Activities API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}