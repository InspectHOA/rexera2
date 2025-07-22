/**
 * Email threads management hook for MIA agent.
 * Handles email fetching, thread grouping, and thread operations.
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';

interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient_email: string;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'BOUNCED' | 'FAILED';
  thread_id: string | null;
  created_at: string;
  attachments?: any[];
}

interface EmailThread {
  thread_id: string | null;
  subject: string;
  emails: Email[];
  lastActivity: string;
  participants: string[];
}

interface UseEmailThreadsOptions {
  workflowId?: string;
  autoSelectFirst?: boolean;
}

export function useEmailThreads({ 
  workflowId, 
  autoSelectFirst = true 
}: UseEmailThreadsOptions) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch emails and build threads
  useEffect(() => {
    const fetchEmails = async () => {
      if (!workflowId) {
        setEmails([]);
        setThreads([]);
        setSelectedThread(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch emails using the API client
        const result = await api.communications.list({
          workflow_id: workflowId,
          communication_type: 'email'
        });
        
        const transformedEmails: Email[] = (Array.isArray(result.data) ? result.data : []).map((comm: any) => ({
          id: comm.id,
          subject: comm.subject || '(No Subject)',
          sender: comm.direction === 'INBOUND' 
            ? (comm.metadata?.from_email || comm.sender_email || 'Unknown Sender')
            : 'mia@rexera.com',
          recipient_email: comm.recipient_email || 'mia@rexera.com',
          body: comm.body || '',
          direction: comm.direction,
          status: comm.status,
          thread_id: comm.thread_id,
          created_at: comm.created_at,
          attachments: comm.email_metadata?.attachments || []
        }));
        
        setEmails(transformedEmails);
        
        // Group emails into threads
        const threadMap = new Map<string, Email[]>();
        transformedEmails.forEach(email => {
          const threadKey = email.thread_id || email.id;
          if (!threadMap.has(threadKey)) {
            threadMap.set(threadKey, []);
          }
          threadMap.get(threadKey)!.push(email);
        });

        const emailThreads: EmailThread[] = Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
          const sortedEmails = threadEmails.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const participants = Array.from(new Set(threadEmails.flatMap(e => [e.sender, e.recipient_email])));
          
          return {
            thread_id: threadId,
            subject: sortedEmails[0].subject,
            emails: sortedEmails,
            lastActivity: sortedEmails[sortedEmails.length - 1].created_at,
            participants
          };
        }).sort((a, b) => 
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );

        setThreads(emailThreads);
        
        // Auto-select first thread if available and enabled
        if (emailThreads.length > 0 && !selectedThread && autoSelectFirst) {
          setSelectedThread(emailThreads[0].thread_id);
        }
        
      } catch (error) {
        console.error('Failed to fetch email communications:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch emails');
        setEmails([]);
        setThreads([]);
      }
      
      setLoading(false);
    };

    fetchEmails();
  }, [workflowId, autoSelectFirst]);

  // Get currently selected thread data
  const selectedThreadData = threads.find(t => t.thread_id === selectedThread);

  // Thread selection actions
  const selectThread = (threadId: string | null) => {
    setSelectedThread(threadId);
  };

  const selectNextThread = () => {
    if (!selectedThread || threads.length <= 1) return;
    
    const currentIndex = threads.findIndex(t => t.thread_id === selectedThread);
    const nextIndex = (currentIndex + 1) % threads.length;
    setSelectedThread(threads[nextIndex].thread_id);
  };

  const selectPreviousThread = () => {
    if (!selectedThread || threads.length <= 1) return;
    
    const currentIndex = threads.findIndex(t => t.thread_id === selectedThread);
    const previousIndex = currentIndex === 0 ? threads.length - 1 : currentIndex - 1;
    setSelectedThread(threads[previousIndex].thread_id);
  };

  // Thread operations
  const refreshThreads = async () => {
    // Re-fetch emails to get latest data
    if (workflowId) {
      setLoading(true);
      setError(null);
      
      try {
        const result = await api.communications.list({
          workflow_id: workflowId,
          communication_type: 'email'
        });
        
        // Process the result same as in useEffect
        // (This duplicates some code but keeps the hook simple)
        const transformedEmails: Email[] = (Array.isArray(result.data) ? result.data : []).map((comm: any) => ({
          id: comm.id,
          subject: comm.subject || '(No Subject)',
          sender: comm.direction === 'INBOUND' 
            ? (comm.metadata?.from_email || comm.sender_email || 'Unknown Sender')
            : 'mia@rexera.com',
          recipient_email: comm.recipient_email || 'mia@rexera.com',
          body: comm.body || '',
          direction: comm.direction,
          status: comm.status,
          thread_id: comm.thread_id,
          created_at: comm.created_at,
          attachments: comm.email_metadata?.attachments || []
        }));
        
        setEmails(transformedEmails);
        
        // Rebuild threads
        const threadMap = new Map<string, Email[]>();
        transformedEmails.forEach(email => {
          const threadKey = email.thread_id || email.id;
          if (!threadMap.has(threadKey)) {
            threadMap.set(threadKey, []);
          }
          threadMap.get(threadKey)!.push(email);
        });

        const emailThreads: EmailThread[] = Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
          const sortedEmails = threadEmails.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const participants = Array.from(new Set(threadEmails.flatMap(e => [e.sender, e.recipient_email])));
          
          return {
            thread_id: threadId,
            subject: sortedEmails[0].subject,
            emails: sortedEmails,
            lastActivity: sortedEmails[sortedEmails.length - 1].created_at,
            participants
          };
        }).sort((a, b) => 
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );

        setThreads(emailThreads);
        
      } catch (error) {
        console.error('Failed to refresh email threads:', error);
        setError(error instanceof Error ? error.message : 'Failed to refresh emails');
      }
      
      setLoading(false);
    }
  };

  const getThreadById = (threadId: string) => {
    return threads.find(t => t.thread_id === threadId);
  };

  const getEmailById = (emailId: string) => {
    return emails.find(e => e.id === emailId);
  };

  return {
    // State
    emails,
    threads,
    selectedThread,
    selectedThreadData,
    loading,
    error,
    
    // Actions
    selectThread,
    selectNextThread,
    selectPreviousThread,
    refreshThreads,
    
    // Utilities
    getThreadById,
    getEmailById,
  };
}