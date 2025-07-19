# Document Management System

This document provides a comprehensive overview of Rexera's document management capabilities, including file handling, organization, and the predefined tagging system.

## 1. Document Architecture

The document management system is built around a unified approach that handles both working documents and final deliverables through a single, robust API.

### Document Types

The system recognizes two primary document categories:

- **`WORKING`** - Internal documents used during workflow processing (drafts, research, intermediate files)
- **`DELIVERABLE`** - Final documents provided to clients (completed forms, certificates, reports)

### Document Lifecycle

1. **Upload** - Files are uploaded with metadata and optional tags
2. **Processing** - Documents may be processed by AI agents (OCR, data extraction)
3. **Versioning** - New versions can be created while maintaining history
4. **Organization** - Tags and metadata help categorize and find documents
5. **Delivery** - Deliverables are made available to clients

## 2. API Endpoints

The document management system provides a comprehensive REST API:

### Core Endpoints

```bash
# List all documents with filtering
GET /api/documents?workflow_id=abc123&document_type=DELIVERABLE&tags=contract,signed

# Get specific document with relations
GET /api/documents/{id}?include=created_by_user,versions

# Upload a new document
POST /api/documents/upload
Content-Type: multipart/form-data
- file: File data
- workflow_id: Target workflow
- document_type: WORKING|DELIVERABLE
- tags: Optional predefined tags

# Update document metadata
PATCH /api/documents/{id}
{
  "tags": ["contract", "signed", "final"],
  "document_type": "DELIVERABLE"
}

# Create a new version
POST /api/documents/{id}/versions
{
  "file": File,
  "version_notes": "Updated with client revisions"
}

# Delete document
DELETE /api/documents/{id}
```

### Document Filtering

The API supports sophisticated filtering:

```typescript
interface DocumentFilters {
  workflow_id?: string;
  document_type?: 'WORKING' | 'DELIVERABLE';
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  tags?: string; // Comma-separated tag names
  created_after?: string;
  created_before?: string;
  filename?: string; // Partial match
  mime_type?: string;
  page?: number;
  limit?: number;
  include?: string[]; // Related data to include
}
```

## 3. Predefined Tagging System

To ensure consistency and organization across all documents, Rexera uses a predefined tagging system with 40 standardized tags.

### Available Tags

The system provides tags organized into logical categories:

**Document Types:**
- contract, deed, title, insurance, inspection, appraisal
- survey, disclosure, amendment, addendum, closing, escrow
- resale-cert, lender-q, hoa-docs, ccnrs

**Document Status:**
- draft, review, approved, signed, executed, final

**Process Stage:**
- pre-approval, listing, offer, under-contract, due-diligence
- financing, closing-prep, post-closing

**Priority/Urgency:**
- urgent, high-priority, time-sensitive

**Client Communication:**
- client-review, client-signature, client-copy

**Legal/Compliance:**
- legal-review, compliance, regulatory, notarized

### Tag Management API

```bash
# Get all predefined tags
GET /api/tags
# Returns: ["addendum", "amendment", "appraisal", "approved", "ccnrs", "client-copy", ...]

# Search tags for autocomplete
GET /api/tags/search?q=contract
# Returns: ["contract", "under-contract"]
```

### Tag Usage

- **Maximum**: 10 tags per document
- **Validation**: Only predefined tags are allowed
- **Search**: Documents can be filtered by tags
- **UI**: Autocomplete and suggestions in all tag selectors

## 4. Frontend Components

The document management system includes several React components for different use cases:

### DocumentManager
Comprehensive document management with advanced features:
- Pagination and sorting
- Bulk operations (select all, delete, download)
- Real-time filtering by type, status, and tags
- Inline tag editing
- Version history

### DocumentList
Simple document listing for basic workflows:
- Clean, minimal interface
- Inline tag editing
- Download and delete actions
- File type icons and metadata

### FileUploadWithTags
Enhanced file upload experience:
- Drag-and-drop support
- Multi-file selection
- Tag assignment before upload
- Document type selection
- Progress tracking

### PredefinedTagSelector
Reusable tag selection component:
- Dropdown with search
- Keyboard navigation
- Visual tag indicators
- Maximum tag enforcement

## 5. File Storage

Documents are stored using Supabase Storage:

### Storage Structure
```
buckets/
  documents/
    {workflow_id}/
      {document_id}/
        {filename}
        v2_{filename}  # Versions
        v3_{filename}
```

### Security
- **Authentication**: All uploads require valid JWT
- **Authorization**: Row-Level Security ensures users only access permitted documents
- **Validation**: File type and size restrictions
- **Virus Scanning**: Automatic malware detection

### Supported Formats
- **Documents**: PDF, DOC, DOCX, TXT, CSV
- **Spreadsheets**: XLS, XLSX
- **Images**: JPG, JPEG, PNG, GIF
- **Size Limit**: 50MB per file

## 6. Integration with Workflows

Documents are tightly integrated with the workflow system:

### Automatic Organization
- Documents are automatically associated with workflows
- Tags help categorize documents by workflow stage
- AI agents can automatically tag extracted documents

### Agent Processing
- **Iris 📄**: Performs OCR and data extraction
- **Corey 🏢**: Analyzes HOA-specific documents
- **Cassy ✓**: Quality validation of processed documents

### Client Deliverables
- Working documents remain internal
- Deliverables are automatically available to clients
- Version history maintains audit trail

## 7. Best Practices

### Tagging Guidelines
- Use consistent tags across similar document types
- Combine status and type tags (e.g., "contract" + "signed")
- Include urgency tags when time-sensitive
- Use client communication tags for external documents

### File Organization
- Use descriptive filenames
- Create new versions rather than uploading duplicates
- Set appropriate document types (WORKING vs DELIVERABLE)
- Add relevant tags immediately upon upload

### Performance Considerations
- Use pagination for large document lists
- Filter by workflow_id when possible
- Include only necessary related data
- Cache tag lists for better UI performance

## 8. Monitoring and Analytics

The document system provides insights into usage patterns:

### Metrics Tracked
- Upload volume by workflow type
- Most commonly used tags
- Average processing times
- Storage usage by client
- Document type distribution

### Error Handling
- Upload failures with retry mechanisms
- File corruption detection
- Storage quota monitoring
- Automatic cleanup of orphaned files

This comprehensive document management system ensures that all files are properly organized, searchable, and accessible while maintaining security and compliance requirements.