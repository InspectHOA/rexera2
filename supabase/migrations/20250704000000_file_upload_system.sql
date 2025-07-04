-- =====================================================
-- File Upload System Setup
-- =====================================================

-- Create storage bucket for workflow documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('workflow-documents', 'workflow-documents', true, 52428800, 
   ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
         'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'image/jpeg', 'image/png', 'image/gif', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for development (allows all operations)
CREATE POLICY "Allow all operations for development" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'workflow-documents')
  WITH CHECK (bucket_id = 'workflow-documents');

-- Update documents table for string-based workflow IDs
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_workflow_id_fkey;
ALTER TABLE documents ALTER COLUMN workflow_id TYPE TEXT;
ALTER TABLE documents ADD CONSTRAINT documents_workflow_id_fkey 
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

-- Update task_id to be string-based as well
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_task_id_fkey;
ALTER TABLE documents ALTER COLUMN task_id TYPE TEXT;

-- Add storage_path field for Supabase storage
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Make created_by nullable for development
ALTER TABLE documents ALTER COLUMN created_by DROP NOT NULL;

-- Disable RLS on documents table for development
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Function to generate document URLs from storage paths
CREATE OR REPLACE FUNCTION get_document_url(storage_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF storage_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN 'https://wmgidablmqotriwlefhq.supabase.co/storage/v1/object/workflow-documents/' || storage_path;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate url from storage_path
CREATE OR REPLACE FUNCTION update_document_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.storage_path IS NOT NULL THEN
    NEW.url = get_document_url(NEW.storage_path);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_url_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_url();