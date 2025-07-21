'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search, Tag } from 'lucide-react';
import { useTags } from '@/lib/hooks/use-tags';

interface PredefinedTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
  label?: string;
}

export function PredefinedTagSelector({ 
  selectedTags, 
  onChange, 
  placeholder = "Select tags...", 
  className = "",
  disabled = false,
  maxTags,
  label
}: PredefinedTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: allTags = [], isLoading } = useTags();

  // Filter tags based on search and exclude already selected
  const availableTags = allTags
    .filter(tag => 
      !selectedTags.includes(tag) && 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 10); // Limit to 10 for performance

  const canAddMore = !maxTags || selectedTags.length < maxTags;

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag) && canAddMore) {
      onChange([...selectedTags, tag]);
      setSearchQuery('');
      setSelectedIndex(-1);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && availableTags[selectedIndex]) {
        addTag(availableTags[selectedIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < availableTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && searchQuery === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when available tags change
  useEffect(() => {
    if (selectedIndex >= availableTags.length) {
      setSelectedIndex(-1);
    }
  }, [availableTags.length, selectedIndex]);

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Main input container */}
        <div 
          className={`
            flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md bg-white cursor-text
            ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
          `}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              searchInputRef.current?.focus();
            }
          }}
        >
          {/* Selected tags */}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-md"
            >
              <Tag className="h-3 w-3" />
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="flex-shrink-0 h-3 w-3 rounded-full inline-flex items-center justify-center text-primary-400 hover:bg-primary-200 hover:text-primary-600 focus:outline-none focus:bg-primary-200 focus:text-primary-600"
                >
                  <X className="h-2 w-2" />
                </button>
              )}
            </span>
          ))}

          {/* Search input */}
          {canAddMore && !disabled && (
            <div className="flex-1 flex items-center min-w-[120px]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={selectedTags.length === 0 ? placeholder : ""}
                className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-400"
                disabled={disabled}
              />
              {!isOpen && (
                <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
              )}
            </div>
          )}

          {/* Max tags indicator */}
          {!canAddMore && (
            <span className="text-xs text-gray-500 px-2 py-1">
              Max {maxTags} tags
            </span>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Loading tags...
              </div>
            ) : availableTags.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchQuery ? `No tags found for "${searchQuery}"` : 'No more tags available'}
              </div>
            ) : (
              <>
                {searchQuery && (
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Search className="h-3 w-3" />
                      Searching for "{searchQuery}"
                    </div>
                  </div>
                )}
                {availableTags.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-2 ${
                      index === selectedIndex ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                    }`}
                  >
                    <Tag className="h-3 w-3 text-gray-400" />
                    {tag}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Select from predefined tags to organize your document
        {maxTags && ` • Max ${maxTags} tags`}
      </p>
    </div>
  );
}