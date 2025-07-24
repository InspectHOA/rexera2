'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, User, Bot } from 'lucide-react';

import type { Communication } from '@rexera/shared';

import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useApiErrorHandling } from '@/lib/hooks/use-error-handling';
import { toast } from '@/lib/hooks/use-toast';

interface ChatInterfaceProps {
  workflowId?: string;
  agentId: string;
}

// Local interface for chat display - transformed from Communication
interface ChatMessage {
  id: string;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  created_at: string;
  thread_id?: string;
  sender_name?: string; // For display purposes
}

export function ChatInterface({ workflowId, agentId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Error handling
  const { executeWithErrorHandling } = useApiErrorHandling();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat messages for the workflow
  const fetchMessages = useCallback(async (isInitialLoad = false) => {
    if (!workflowId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Only show loading spinner on initial load, not on polling
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // Fetch client chat communications for this workflow
      const result = await api.communications.list({
        workflow_id: workflowId,
        communication_type: 'client_chat' // Using client_chat type for chat interface
      });
      
      const transformedMessages: ChatMessage[] = (Array.isArray(result.data) ? result.data : []).map((comm: any) => ({
        id: comm.id,
        body: comm.body || '',
        direction: comm.direction,
        status: comm.status,
        created_at: comm.created_at,
        thread_id: comm.thread_id,
        sender_name: comm.direction === 'INBOUND' ? 'Client' : 'Ria'
      }));
      
      // Sort messages by creation time
      transformedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setMessages(transformedMessages);
      
      // Set thread ID from first message, or generate consistent one for workflow
      if (transformedMessages.length > 0) {
        // Use the thread_id from the first message if it exists
        const firstThreadId = transformedMessages.find(msg => !!msg.thread_id)?.thread_id;
        setThreadId(firstThreadId || crypto.randomUUID());
      }
      
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      // Only show error toast on initial load, not on polling
      if (isInitialLoad) {
        toast({
          variant: 'destructive',
          title: 'Failed to load chat',
          description: 'Unable to fetch chat messages. Please refresh to try again.',
        });
      }
      setMessages([]);
    }
    
    if (isInitialLoad) {
      setLoading(false);
    }
  }, [workflowId, toast]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchMessages(true); // Initial load with loading spinner
    
    // Set up polling for real-time updates
    if (workflowId) {
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(false); // Polling without loading spinner
      }, 5000); // Poll every 5 seconds (reduced frequency)
    }
    
    // Cleanup polling on unmount or workflowId change
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [workflowId, fetchMessages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !workflowId) {
      return;
    }

    setSending(true);
    
    const result = await executeWithErrorHandling(async () => {
      // Generate thread ID if this is the first message
      const chatThreadId = threadId || crypto.randomUUID();
      
      // Create new chat message
      await api.communications.create({
        workflow_id: workflowId,
        thread_id: chatThreadId,
        recipient_email: null,
        subject: null,
        body: newMessage.trim(),
        communication_type: 'client_chat',
        direction: 'OUTBOUND',
        metadata: {
          chat_message: true,
          agent_id: agentId
        }
      });

      // Clear message input
      setNewMessage('');

      // Refresh messages to show the new one
      await fetchMessages(false);
      
      return true;
    });

    if (result) {
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: 'Please try again or contact support if the problem persists.',
      });
    }
    
    setSending(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffHours < 48) return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-2" />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Client Chat</h3>
            <p className="text-sm text-muted-foreground">
              {messages.length === 0 ? 'No messages yet' : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Start a conversation with your client below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 max-w-4xl',
                message.direction === 'OUTBOUND' ? 'ml-auto flex-row-reverse' : ''
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                message.direction === 'OUTBOUND' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {message.direction === 'OUTBOUND' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div className={cn(
                'flex-1 max-w-lg',
                message.direction === 'OUTBOUND' ? 'text-right' : ''
              )}>
                {/* Sender Name & Timestamp */}
                <div className={cn(
                  'flex items-center gap-2 mb-1 text-xs text-muted-foreground',
                  message.direction === 'OUTBOUND' ? 'justify-end' : ''
                )}>
                  <span className="font-medium">{message.sender_name}</span>
                  <span>•</span>
                  <span>{formatTimestamp(message.created_at)}</span>
                  {message.direction === 'OUTBOUND' && (
                    <>
                      <span>•</span>
                      <span className={cn(
                        'capitalize',
                        message.status === 'SENT' ? 'text-blue-600' :
                        message.status === 'DELIVERED' ? 'text-green-600' :
                        message.status === 'READ' ? 'text-green-700' :
                        'text-red-600'
                      )}>
                        {message.status.toLowerCase()}
                      </span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  message.direction === 'OUTBOUND' 
                    ? 'bg-primary text-primary-foreground ml-8' 
                    : 'bg-muted text-foreground mr-8'
                )}>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background text-foreground min-h-[40px] max-h-32"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 min-w-[80px] h-10',
              newMessage.trim() && !sending
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="text-sm">{sending ? 'Sending' : 'Send'}</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}