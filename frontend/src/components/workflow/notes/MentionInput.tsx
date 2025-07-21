'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

// Mock users - in a real app, this would come from an API
const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike@example.com' },
  { id: 'user-4', name: 'Sarah Wilson', email: 'sarah@example.com' },
];

export function MentionInput({ 
  value, 
  onChange, 
  placeholder = 'Type @ to mention someone...',
  rows = 3,
  className 
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredUsers = MOCK_USERS.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // The user ID
    }
    
    return mentions;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check if we're typing after an @ symbol
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([^@\s]*)$/);
    
    if (mentionMatch) {
      setShowSuggestions(true);
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPosition - mentionMatch[0].length);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
    
    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  const insertMention = (user: User) => {
    if (!textareaRef.current) return;
    
    const beforeMention = value.substring(0, mentionPosition);
    const afterCursor = value.substring(textareaRef.current.selectionStart);
    const mentionText = `@[${user.name}](${user.id})`;
    
    const newValue = beforeMention + mentionText + ' ' + afterCursor;
    const newCursorPosition = beforeMention.length + mentionText.length + 1;
    
    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
    
    setShowSuggestions(false);
    
    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredUsers.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display value with mentions highlighted
  const displayValue = value.replace(
    /@\[([^\]]+)\]\([^)]+\)/g,
    '@$1'
  );

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={cn("resize-none", className)}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-64 mt-1 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: '100%',
            left: 0,
          }}
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none",
                index === selectedIndex && "bg-accent"
              )}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}