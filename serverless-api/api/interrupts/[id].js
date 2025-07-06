/**
 * Individual interrupt endpoint for Vercel serverless function.
 * Handles getting and updating interrupt by ID.
 */

const { z } = require('zod');
const { createServerClient } = require('../../utils/database');
const { handleError } = require('../../utils/errors');

const updateInterruptSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']).optional(),
  assigned_to: z.string().optional(),
  resolution: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createServerClient();
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid interrupt ID'
    });
  }

  try {
    if (req.method === 'GET') {
      // Get interrupt by ID
      const { data: interrupt, error } = await supabase
        .from('interrupts')
        .select(`
          *,
          workflow:workflows(id, title, workflow_type, status),
          task:tasks(id, title, status),
          assigned_user:user_profiles!interrupts_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch interrupt: ${error.message}`);
      }

      if (!interrupt) {
        return res.status(404).json({
          success: false,
          error: 'Interrupt not found'
        });
      }

      return res.json({
        success: true,
        data: interrupt
      });

    } else if (req.method === 'PUT') {
      // Update interrupt
      const input = updateInterruptSchema.parse(req.body);

      const { data: interrupt, error } = await supabase
        .from('interrupts')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          workflow:workflows(id, title, workflow_type, status),
          task:tasks(id, title, status),
          assigned_user:user_profiles!interrupts_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update interrupt: ${error.message}`);
      }

      return res.json({
        success: true,
        data: interrupt
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    return handleError(error, res, 'Failed to process interrupt request');
  }
};