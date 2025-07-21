# Document Management System

## Overview

Handles document upload, storage, processing, and version control for workflow-related files with AI-powered extraction capabilities.

## Architecture

```
Document Sources           Platform              Storage & Processing
┌─────────────┐           ┌─────────────┐       ┌─────────────┐
│ File Upload │──────────►│ Document    │──────►│ File Storage│
│ Email Attach│           │ Management  │       │ (Cloud)     │
│ Agent Output│           │             │       │             │
└─────────────┘           │ Iris Agent  │◄──────│ AI Extraction│
                          │ Processing  │       │ & Analysis  │
                          └─────────────┘       └─────────────┘
```

## Database Schema

**Core Table**: `documents`

Key fields:
- `workflow_id`: Parent workflow
- `filename`: Original file name
- `url`: Storage location (cloud URL)
- `file_size_bytes`: File size
- `mime_type`: File type
- `document_type`: 'WORKING' | 'DELIVERABLE' | 'REFERENCE'
- `status`: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
- `version`: Document version number
- `created_by`: User who uploaded
- `metadata`: Extracted data and processing results

## Document Types

**Working Documents:**
- Source files uploaded during workflow
- Client-provided documents
- Temporary processing files

**Deliverables:**
- Final output documents
- Generated reports
- Completed forms/applications

**Reference:**
- Templates and form blanks
- Legal documents
- Process guidelines

## Upload Process

**Frontend Upload:**
```typescript
<FileUpload
  workflowId={workflowId}
  onUploadComplete={(document) => {
    // Handle successful upload
  }}
/>
```

**API Integration:**
```bash
POST /api/documents
Content-Type: multipart/form-data

{
  file: [binary data],
  workflow_id: "uuid",
  document_type: "WORKING",
  metadata: { tags: ["tax_return"] }
}
```

## AI Processing (Iris Agent)

**Document Extraction:**
1. **Upload triggers processing** pipeline
2. **Iris agent analyzes** document content
3. **Data extraction** (amounts, dates, entities)
4. **Structured output** stored in metadata
5. **HIL review** if extraction uncertain

**Extraction Capabilities:**
- Tax document analysis
- Payoff statement processing
- HOA document parsing
- Form data extraction

## Version Control

**Document Versioning:**
- Automatic version increment on updates
- `change_summary` field for version notes
- Previous versions retained for audit trail

```typescript
// Create new version
POST /api/documents/{id}/versions
{
  url: "new_file_url",
  change_summary: "Updated with client corrections",
  metadata: { extracted_data: {...} }
}
```

## File Storage

**Cloud Storage Integration:**
- Files stored in cloud storage (AWS S3, etc.)
- Database stores metadata and URLs only
- Secure access with signed URLs
- Automatic backup and redundancy

## Frontend Components

**Document List:**
```typescript
<DocumentList
  workflowId={workflowId}
  onDocumentDeleted={() => {
    // Refresh document list
  }}
/>
```

Features:
- File type icons and previews
- Download/view functionality
- Version history
- Processing status indicators

**Document Viewer:**
- In-browser PDF viewing
- Image preview capabilities
- Extracted data overlay
- Annotation support

## API Endpoints

```bash
GET    /api/documents              # List documents
POST   /api/documents              # Upload document
GET    /api/documents/{id}         # Get document details
DELETE /api/documents/{id}         # Delete document
POST   /api/documents/{id}/versions    # Create new version
GET    /api/documents/{id}/download    # Download file
```

## Integration Points

**Workflow Events:**
- Automatic document requests
- Completion triggers on required docs
- Missing document notifications

**Agent Processing:**
- Iris agent automatic processing
- Extraction results feed back to workflow
- HIL intervention for manual review

## Security & Compliance

**Access Control:**
- User-based document access
- Workflow-scoped permissions
- Audit trail of all document access

**Data Protection:**
- Encrypted file storage
- Secure file transfer
- PII detection and handling
- Retention policy compliance

## Key Features

- **Drag-and-drop upload** with progress tracking
- **AI-powered extraction** via Iris agent
- **Version control** with change tracking
- **Secure storage** with access controls
- **Real-time processing** status updates
- **Integration** with workflow automation