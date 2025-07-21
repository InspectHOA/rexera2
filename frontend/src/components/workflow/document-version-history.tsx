'use client';

import { useState } from 'react';
import { Clock, FileText, User, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useDocument, useDocumentMutations } from '@/lib/hooks/use-documents';
import type { Document, CreateDocumentVersion } from '@rexera/shared';

interface DocumentVersionHistoryProps {
  documentId: string;
  onVersionCreated?: (document: Document) => void;
}

export function DocumentVersionHistory({ documentId, onVersionCreated }: DocumentVersionHistoryProps) {
  const { data: document, isLoading } = useDocument(documentId, ['created_by_user']);
  const { createVersion } = useDocumentMutations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);
  const [newVersionData, setNewVersionData] = useState<Partial<CreateDocumentVersion>>({
    url: '',
    filename: '',
    change_summary: '',
  });

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVersionData.url || !newVersionData.change_summary) {
      alert('URL and change summary are required');
      return;
    }

    try {
      const versionData: CreateDocumentVersion = {
        url: newVersionData.url,
        filename: newVersionData.filename || document?.filename,
        change_summary: newVersionData.change_summary,
        metadata: {},
      };

      const updatedDocument = await createVersion.mutateAsync({
        id: documentId,
        data: versionData,
      });

      onVersionCreated?.(updatedDocument);
      setShowNewVersionForm(false);
      setNewVersionData({ url: '', filename: '', change_summary: '' });
    } catch (error) {
      alert('Failed to create version: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-sm text-gray-500 py-4">
        Document not found
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <FileText className="h-5 w-5 text-gray-400" />
          <div className="text-left">
            <h3 className="font-medium text-gray-900">Version History</h3>
            <p className="text-sm text-gray-500">
              Current version: {document.version} • Last updated {formatDate(document.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            v{document.version}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 space-y-4">
            {/* Current Version */}
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">v{document.version}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Current
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={document.url}
                      download={document.filename}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 transition-colors duration-200"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {document.change_summary || 'Initial version'}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(document.updated_at)}
                  {document.created_by_user && (
                    <>
                      <User className="h-3 w-3 ml-3 mr-1" />
                      {document.created_by_user.email}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* New Version Form */}
            <div className="border-t border-gray-200 pt-4">
              {showNewVersionForm ? (
                <form onSubmit={handleCreateVersion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New File URL
                    </label>
                    <input
                      type="url"
                      value={newVersionData.url}
                      onChange={(e) => setNewVersionData({ ...newVersionData, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://example.com/new-file.pdf"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filename (optional)
                    </label>
                    <input
                      type="text"
                      value={newVersionData.filename}
                      onChange={(e) => setNewVersionData({ ...newVersionData, filename: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={document.filename}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Summary
                    </label>
                    <textarea
                      value={newVersionData.change_summary}
                      onChange={(e) => setNewVersionData({ ...newVersionData, change_summary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      placeholder="Describe what changed in this version..."
                      required
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={createVersion.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {createVersion.isPending ? 'Creating...' : 'Create Version'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewVersionForm(false)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewVersionForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Create New Version
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}