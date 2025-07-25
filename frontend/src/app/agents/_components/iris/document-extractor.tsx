'use client';

import { useState } from 'react';
import { AgentLayout } from '../shared/agent-layout';
import { Upload, FileText, Image as ImageIcon, Download, Eye, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentExtractorProps {
  workflowId?: string;
  agentId: string;
}

export function DocumentExtractor({ workflowId, agentId }: DocumentExtractorProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Dummy document data
  const documents = [
    {
      id: '1',
      filename: 'payoff_statement.pdf',
      type: 'application/pdf',
      size: '2.4 MB',
      status: 'completed',
      uploadedAt: '2 hours ago',
      extractedData: {
        loanNumber: 'LN-123456789',
        principalBalance: '$240,000.00',
        payoffAmount: '$245,678.90',
        goodThroughDate: '2024-07-15'
      }
    },
    {
      id: '2',
      filename: 'hoa_statement.pdf',
      type: 'application/pdf',
      size: '1.8 MB',
      status: 'processing',
      uploadedAt: '30 minutes ago',
      extractedData: null
    },
    {
      id: '3',
      filename: 'property_deed.jpg',
      type: 'image/jpeg',
      size: '3.2 MB',
      status: 'failed',
      uploadedAt: '1 hour ago',
      extractedData: null,
      error: 'Image quality too low for OCR processing'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing': return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-600" />;
    return <FileText className="w-8 h-8 text-red-600" />;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Handle file upload here
  };

  const actions = (
    <div className="flex items-center gap-2">
      <Button className="flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Upload Document
      </Button>
    </div>
  );

  return (
    <AgentLayout
      agentName="Iris"
      agentDescription="Document Extraction Agent"
      actions={actions}
    >
      <div className="flex h-full">
        {/* Document List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Upload Area */}
          <div
            className={`m-4 p-6 border-2 border-dashed rounded-lg transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-400">
                PDF, DOC, DOCX, JPG, PNG up to 10MB
              </p>
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Documents ({documents.length})</h3>
            </div>
            
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                    selectedDocument === doc.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </p>
                        {getStatusIcon(doc.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {doc.size} • {doc.uploadedAt}
                      </p>
                      <div className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                        doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                        doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        doc.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {doc.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="flex-1 bg-gray-50">
          {selectedDocument ? (
            <div className="h-full flex flex-col">
              {(() => {
                const doc = documents.find(d => d.id === selectedDocument);
                if (!doc) return null;
                
                return (
                  <>
                    {/* Document Header */}
                    <div className="bg-white border-b border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.type)}
                          <div>
                            <h3 className="font-semibold text-gray-900">{doc.filename}</h3>
                            <p className="text-sm text-gray-600">
                              {doc.size} • Uploaded {doc.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Document Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {doc.status === 'completed' && doc.extractedData ? (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Extracted Data</h4>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                              <div className="grid grid-cols-2 gap-4">
                                {Object.entries(doc.extractedData).map(([key, value]) => (
                                  <div key={key} className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                      {value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Document Preview</h4>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-gray-500">PDF Preview would go here</p>
                              <Button className="mt-4">
                                View Full Document
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : doc.status === 'processing' ? (
                        <div className="text-center py-12">
                          <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500 animate-spin" />
                          <p className="text-gray-600 mb-2">Processing document...</p>
                          <p className="text-sm text-gray-400">
                            Extracting data using OCR and AI analysis
                          </p>
                        </div>
                      ) : doc.status === 'failed' ? (
                        <div className="text-center py-12">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                          <p className="text-gray-600 mb-2">Processing failed</p>
                          <p className="text-sm text-red-600 mb-4">{doc.error}</p>
                          <Button>
                            Retry Processing
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a document to view extraction results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
}