'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MentionInput } from './mention-input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Plus, Filter, Check, X } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { HilNote, CreateHilNote, PriorityLevel } from '@rexera/shared';
import { useAuth } from '@/lib/auth/provider';
import { formatDistanceToNow } from 'date-fns';

interface NotesTabProps {
  workflowId: string;
}

const PRIORITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
  NORMAL: 'bg-gray-100 text-gray-800 border-gray-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
} as const;

export function NotesTab({ workflowId }: NotesTabProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<HilNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<PriorityLevel>('NORMAL');
  const [newNoteMentions, setNewNoteMentions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(false);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await api.hilNotes.list({
        workflow_id: workflowId,
        is_resolved: filterResolved,
        include: 'author,replies',
        page: 1,
        limit: 50
      });
      
      // Sort notes by newest date first
      const sortedNotes = fetchedNotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setNotes(sortedNotes);
      setError(null);
    } catch (err) {
      console.error('Failed to load notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [workflowId, filterResolved]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !user) return;

    try {
      setSubmitting(true);
      
      const noteData: CreateHilNote = {
        workflow_id: workflowId,
        content: newNoteContent.trim(),
        priority: newNotePriority,
        mentions: newNoteMentions
      };

      await api.hilNotes.create(noteData);
      setNewNoteContent('');
      setNewNotePriority('NORMAL');
      setNewNoteMentions([]);
      setShowNewNote(false);
      loadNotes(); // Refresh notes
    } catch (err) {
      console.error('Failed to create note:', err);
      setError('Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolved = async (noteId: string, currentResolved: boolean) => {
    try {
      await api.hilNotes.update(noteId, {
        is_resolved: !currentResolved
      });
      loadNotes(); // Refresh notes
    } catch (err) {
      console.error('Failed to update note:', err);
      setError('Failed to update note');
    }
  };

  const renderNoteContent = (content: string) => {
    // Convert mention format @[Name](id) to clickable mentions
    return content.replace(
      /@\[([^\]]+)\]\([^)]+\)/g,
      '<span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">@$1</span>'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={loadNotes} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-lg font-medium">Notes</h3>
          <Badge variant="secondary" className="ml-2">
            {notes.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filter by resolved status */}
          <Select
            value={filterResolved === undefined ? 'all' : filterResolved ? 'resolved' : 'unresolved'}
            onValueChange={(value: string) => {
              if (value === 'all') setFilterResolved(undefined);
              else if (value === 'resolved') setFilterResolved(true);
              else setFilterResolved(false);
            }}
          >
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notes</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => setShowNewNote(true)}
            disabled={showNewNote}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* New note form */}
      {showNewNote && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Add New Note</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewNote(false);
                  setNewNoteContent('');
                  setNewNotePriority('NORMAL');
                  setNewNoteMentions([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNote} className="space-y-3">
              <MentionInput
                placeholder="Enter your note... (use @username to mention someone)"
                value={newNoteContent}
                onChange={(content, mentions) => {
                  setNewNoteContent(content);
                  setNewNoteMentions(mentions);
                }}
                rows={3}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Priority:</label>
                  <Select
                    value={newNotePriority}
                    onValueChange={(value: string) => setNewNotePriority(value as PriorityLevel)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewNote(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newNoteContent.trim() || submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No notes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add the first note to start a conversation about this workflow.
          </p>
          <Button
            onClick={() => setShowNewNote(true)}
            disabled={showNewNote}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Note
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className={note.is_resolved ? 'opacity-75' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {note.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{note.author?.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={PRIORITY_COLORS[note.priority as keyof typeof PRIORITY_COLORS]} variant="outline">
                      {note.priority}
                    </Badge>
                    {note.is_resolved && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <Check className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div 
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderNoteContent(note.content) }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {note.replies && note.replies.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {note.replies.length} {note.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                    {note.mentions && note.mentions.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {note.mentions.length} mentioned
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleResolved(note.id, note.is_resolved)}
                    >
                      {note.is_resolved ? 'Reopen' : 'Resolve'}
                    </Button>
                  </div>
                </div>
                
                {/* TODO: Add replies here */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}