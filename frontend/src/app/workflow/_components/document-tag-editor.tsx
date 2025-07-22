'use client';

import { useState } from 'react';
import { Tag, Edit3, Check, X } from 'lucide-react';
import { useDocumentMutations } from '@/lib/hooks/use-documents';
import { PredefinedTagSelector } from '@/components/ui/predefined-tag-selector';
import type { Document } from '@rexera/shared';

interface DocumentTagEditorProps {
  document: Document;
  onTagsUpdated?: (document: Document) => void;
  inline?: boolean;
}

export function DocumentTagEditor({ 
  document, 
  onTagsUpdated,
  inline = false
}: DocumentTagEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const { updateDocument } = useDocumentMutations();

  const handleSave = async () => {
    try {
      const updatedDocument = await updateDocument.mutateAsync({
        id: document.id,
        data: { tags }
      });
      onTagsUpdated?.(updatedDocument);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update tags:', error);
      // Reset tags on error
      setTags(document.tags || []);
    }
  };

  const handleCancel = () => {
    setTags(document.tags || []);
    setIsEditing(false);
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2 min-h-[32px]">
        <Tag className="h-3 w-3 text-gray-400 flex-shrink-0" />
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 min-w-0">
              <PredefinedTagSelector
                selectedTags={tags}
                onChange={setTags}
                placeholder="Add tags..."
                className="text-xs"
                maxTags={10}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={updateDocument.isPending}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-200"
                title="Save tags"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancel}
                disabled={updateDocument.isPending}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                title="Cancel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {tags.length > 0 ? (
              <div className="flex gap-1 flex-wrap">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No tags</span>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 ml-1"
              title="Edit tags"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Document Tags
        </h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <PredefinedTagSelector
            selectedTags={tags}
            onChange={setTags}
            placeholder="Add tags to organize this document..."
            maxTags={10}
          />
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={updateDocument.isPending}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 border border-transparent rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateDocument.isPending ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Save Tags
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={updateDocument.isPending}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No tags assigned. Click Edit to add tags for better organization.
            </p>
          )}
        </div>
      )}
    </div>
  );
}