'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
  suggestions?: string[];
}

export function TagInput({ 
  tags, 
  onChange, 
  placeholder = "Add tags...", 
  className = "",
  disabled = false,
  maxTags,
  suggestions = []
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
    )
    .slice(0, 5); // Limit to 5 suggestions

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && (!maxTags || tags.length < maxTags)) {
      onChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion >= 0 && filteredSuggestions[selectedSuggestion]) {
        addTag(filteredSuggestions[selectedSuggestion]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
    setSelectedSuggestion(-1);
  };

  const handleInputFocus = () => {
    if (inputValue.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }, 200);
  };

  // Update selected suggestion when filtered suggestions change
  useEffect(() => {
    if (selectedSuggestion >= filteredSuggestions.length) {
      setSelectedSuggestion(filteredSuggestions.length - 1);
    }
  }, [filteredSuggestions.length, selectedSuggestion]);

  const canAddMore = !maxTags || tags.length < maxTags;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
        {/* Existing tags */}
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-md"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="flex-shrink-0 ml-1 h-3 w-3 rounded-full inline-flex items-center justify-center text-primary-400 hover:bg-primary-200 hover:text-primary-600 focus:outline-none focus:bg-primary-200 focus:text-primary-600"
              >
                <X className="h-2 w-2" />
              </button>
            )}
          </span>
        ))}

        {/* Input field */}
        {canAddMore && !disabled && (
          <div className="relative flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={tags.length === 0 ? placeholder : ""}
              className="w-full text-sm bg-transparent border-none outline-none placeholder-gray-400"
              disabled={disabled}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                      index === selectedSuggestion ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-3 w-3 text-gray-400" />
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add tag button for when max tags reached */}
        {!canAddMore && (
          <span className="text-xs text-gray-500 px-2 py-1">
            Max {maxTags} tags
          </span>
        )}
      </div>

      {/* Help text */}
      <p className="mt-1 text-xs text-gray-500">
        Press Enter, comma, or semicolon to add tags
        {maxTags && ` • Max ${maxTags} tags`}
      </p>
    </div>
  );
}