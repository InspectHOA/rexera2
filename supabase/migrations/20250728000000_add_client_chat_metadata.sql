-- =====================================================
-- Add Client Chat Metadata Support
-- Migration to add client_chat_metadata table and 
-- update communication status enum for client chat
-- =====================================================

-- Add client chat status to enum
ALTER TYPE email_status ADD VALUE IF NOT EXISTS 'DRAFT';

-- Add external platform type enum for client chat metadata
CREATE TYPE external_platform_type AS ENUM ('qualia', 'gridbase', 'salesforce', 'custom');

-- Create client chat metadata table
CREATE TABLE client_chat_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    external_platform_type external_platform_type,
    external_platform_id TEXT,
    cc_recipients TEXT[], -- Will store email addresses
    bcc_recipients TEXT[], -- Will store email addresses
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id)
);

-- Add index for performance
CREATE INDEX idx_client_chat_metadata_communication ON client_chat_metadata(communication_id);
CREATE INDEX idx_client_chat_metadata_platform_type ON client_chat_metadata(external_platform_type);
CREATE INDEX idx_client_chat_metadata_platform_id ON client_chat_metadata(external_platform_id);

-- Add trigger for updated_at if we decide to add it later
-- For now, just created_at as per the schema design

-- Add table comment
COMMENT ON TABLE client_chat_metadata IS 'Metadata specific to client chat communications, including external platform tracking and additional recipients';
COMMENT ON COLUMN client_chat_metadata.external_platform_type IS 'External platform type (qualia, gridbase, salesforce, custom)';
COMMENT ON COLUMN client_chat_metadata.external_platform_id IS 'External platform-specific identifier for this communication';
COMMENT ON COLUMN client_chat_metadata.cc_recipients IS 'Array of email addresses to CC on client chat communications';
COMMENT ON COLUMN client_chat_metadata.bcc_recipients IS 'Array of email addresses to BCC on client chat communications';