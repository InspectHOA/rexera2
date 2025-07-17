/**
 * Unit tests for workflow-resolver utility
 */

import { isUUID, resolveWorkflowId } from '../../src/utils/workflow-resolver';

describe('Workflow Resolver Utils', () => {
  describe('isUUID', () => {
    it('should validate correct UUID format', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000',
        'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
      ];

      validUUIDs.forEach(uuid => {
        expect(isUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        '1001',
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // too long
        '123g4567-e89b-12d3-a456-426614174000', // invalid character 'g'
        '',
        null,
        undefined
      ];

      invalidUUIDs.forEach(uuid => {
        expect(isUUID(uuid as string)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true); // uppercase
      expect(isUUID('123e4567e89b12d3a456426614174000')).toBe(false); // no hyphens
      expect(isUUID(' 123e4567-e89b-12d3-a456-426614174000 ')).toBe(false); // with spaces
    });
  });

  describe('resolveWorkflowId', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return UUID directly when input is already a UUID', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = await resolveWorkflowId(mockSupabase as any, uuid);
      
      expect(result).toBe(uuid);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });


    it('should throw error when workflow not found', async () => {
      const humanId = '9999';
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      });

      await expect(resolveWorkflowId(mockSupabase as any, humanId))
        .rejects.toThrow('Workflow not found with ID: 9999');
    });

    it('should throw error when database query fails', async () => {
      const humanId = '1001';
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(resolveWorkflowId(mockSupabase as any, humanId))
        .rejects.toThrow('Workflow not found with ID: 1001');
    });

    it('should throw error when workflow data is null', async () => {
      const humanId = '1001';
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      await expect(resolveWorkflowId(mockSupabase as any, humanId))
        .rejects.toThrow('Workflow not found with ID: 1001');
    });
  });
});