'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Reply, Forward, Archive, Trash2, Send, ChevronLeft, ChevronRight } from 'lucide-react';

import type { Communication } from '@rexera/shared';

import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useApiErrorHandling } from '@/lib/hooks/use-error-handling';
import { toast } from '@/lib/hooks/use-toast';

interface EmailInterfaceProps {
  workflowId?: string;
  agentId: string;
}

// Local interface for email display - extends Communication with UI-specific fields
interface Email {
  id: string;
  subject: string;
  sender: string; // Transformed from sender_id or metadata
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

export function EmailInterface({ workflowId, agentId }: EmailInterfaceProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Error handling
  const { executeWithErrorHandling } = useApiErrorHandling();
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [forwardText, setForwardText] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [forwardSubject, setForwardSubject] = useState('');
  
  // Compose email state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  
  // Reply and forward loading states
  const [replySending, setReplySending] = useState(false);
  const [forwardSending, setForwardSending] = useState(false);
  
  // Include team state
  const [replyIncludeTeam, setReplyIncludeTeam] = useState(false);
  const [forwardIncludeTeam, setForwardIncludeTeam] = useState(false);

  // Function to refresh email data
  const fetchEmails = async () => {
    if (!workflowId) {
      setEmails([]);
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Fetch emails using the API client
      const result = await api.communications.list({
        workflow_id: workflowId,
        communication_type: 'email'  // Use backend parameter name directly
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
        const sortedEmails = threadEmails.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const participants = Array.from(new Set(threadEmails.flatMap(e => [e.sender, e.recipient_email])));
        
        return {
          thread_id: threadId,
          subject: sortedEmails[0].subject,
          emails: sortedEmails,
          lastActivity: sortedEmails[sortedEmails.length - 1].created_at,
          participants
        };
      }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

      setThreads(emailThreads);
      
      // Auto-select first thread if available
      if (emailThreads.length > 0 && !selectedThread) {
        setSelectedThread(emailThreads[0].thread_id);
      }
      
    } catch (error) {
      console.error('Failed to fetch email communications:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load emails',
        description: 'Unable to fetch email conversations. Please refresh to try again.',
      });
      // Error is handled by setting empty state
      setEmails([]);
      setThreads([]);
    }
    
    setLoading(false);
  };

  // Fetch real emails from the database
  useEffect(() => {
    const fetchData = async () => {
      await fetchEmails();
    };

    fetchData();
  }, [workflowId]);

  const selectedThreadData = threads.find(t => t.thread_id === selectedThread);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'READ': return 'dm-status-read';
      case 'sent': return 'dm-status-sent';
      case 'delivered': return 'dm-status-delivered';
      case 'failed': return 'dm-status-failed';
      case 'bounced': return 'dm-status-bounced';
      default: return 'dm-text-muted';
    }
  };

  // Handle sending a new email
  const handleSendEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || !workflowId) {
      return;
    }

    setComposeSending(true);
    
    const result = await executeWithErrorHandling(async () => {
      // Create new email communication
      await api.communications.create({
        workflow_id: workflowId,
        recipient_email: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody.trim(),
        communication_type: 'email',
        direction: 'OUTBOUND',
        metadata: {},
        email_metadata: {
          message_id: `${Date.now()}@rexera.com`,
          email_references: [],
          attachments: [],
          headers: {}
        }
      });

      // Clear compose form
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setComposeOpen(false);

      // Refresh the email list to show the new email
      await fetchEmails();
      
      return true;
    });

    if (result) {
      toast({
        title: 'Email sent',
        description: `Message sent to ${composeTo.trim()}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to send email',
        description: 'Please try again or contact support if the problem persists.',
      });
    }
    
    setComposeSending(false);
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !replyTo.trim() || !selectedThreadData || !workflowId) {
      return;
    }

    setReplySending(true);
    
    const result = await executeWithErrorHandling(async () => {
      // Get the latest email in the thread to reply to
      const latestEmail = selectedThreadData.emails[selectedThreadData.emails.length - 1];
      
      // Create reply using the reply endpoint
      await api.communications.reply(latestEmail.id, {
        recipient_email: replyTo.trim(),
        body: replyText.trim(),
        include_team: replyIncludeTeam,
        metadata: {}
      });

      // Clear reply form
      setReplyText('');
      setReplyTo('');
      setReplyIncludeTeam(false);
      setReplyOpen(false);

      // Refresh the email list to show the new reply
      await fetchEmails();
      
      return true;
    });

    if (result) {
      toast({
        title: 'Reply sent',
        description: `Reply sent to ${replyTo.trim()}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to send reply',
        description: 'Please try again or contact support if the problem persists.',
      });
    }
    
    setReplySending(false);
  };

  // Handle sending a forward
  const handleSendForward = async () => {
    if (!forwardText.trim() || !forwardTo.trim() || !forwardSubject.trim() || !selectedThreadData || !workflowId) {
      return;
    }

    setForwardSending(true);
    
    const result = await executeWithErrorHandling(async () => {
      // Get the latest email in the thread to forward
      const latestEmail = selectedThreadData.emails[selectedThreadData.emails.length - 1];
      
      // Create forward using the forward endpoint
      await api.communications.forward(latestEmail.id, {
        recipient_email: forwardTo.trim(),
        subject: forwardSubject.trim(),
        body: forwardText.trim(),
        include_team: forwardIncludeTeam,
        metadata: {}
      });

      // Clear forward form
      setForwardText('');
      setForwardTo('');
      setForwardSubject('');
      setForwardIncludeTeam(false);
      setForwardOpen(false);

      // Refresh the email list to show the new forward
      await fetchEmails();
      
      return true;
    });

    if (result) {
      toast({
        title: 'Email forwarded',
        description: `Message forwarded to ${forwardTo.trim()}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to forward email',
        description: 'Please try again or contact support if the problem persists.',
      });
    }
    
    setForwardSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-2" />
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* Thread List - Left Side */}
      <div className={cn(
        'bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out relative',
        sidebarCollapsed ? 'w-12' : 'w-64 lg:w-72 xl:w-80'
      )}>
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-4 z-10 bg-card border border-border rounded-full p-1 hover:bg-muted transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {!sidebarCollapsed && (
          <>
            {/* Compact Header */}
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Threads ({threads.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setComposeOpen(true)}
                  className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-1.5 hover:bg-primary/90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>
            </div>
          </>
        )}

        {sidebarCollapsed && (
          <div className="p-2 border-b border-border flex flex-col items-center gap-2">
            <button
              onClick={() => setComposeOpen(true)}
              className="bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90"
              title="New email"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="text-xs text-muted-foreground font-medium">
              {threads.length}
            </div>
          </div>
        )}
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">No email conversations yet</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.thread_id}
                onClick={() => setSelectedThread(thread.thread_id)}
                className={cn(
                  'border-b border-border cursor-pointer hover:bg-muted/50',
                  sidebarCollapsed ? 'p-2' : 'p-3',
                  selectedThread === thread.thread_id ? 'bg-primary/10 border-primary/20' : ''
                )}
                title={sidebarCollapsed ? `${thread.subject} - ${thread.participants.filter(p => p !== 'mia@rexera.com').join(', ')}` : undefined}
              >
                {sidebarCollapsed ? (
                  // Collapsed view: Avatar + email count + unread indicator
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium mb-1">
                      {thread.participants.filter(p => p !== 'mia@rexera.com')[0]?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                        {thread.emails.length}
                      </span>
                      {thread.emails.some(e => e.direction === 'INBOUND' && e.status !== 'READ') && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Expanded view: Full thread information
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate flex-1 mr-2">
                        {thread.subject}
                      </h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimestamp(thread.lastActivity)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground truncate flex-1">
                        {thread.participants.filter(p => p !== 'mia@rexera.com').join(', ')}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {thread.emails.length}
                        </span>
                        {thread.emails.some(e => e.direction === 'INBOUND' && e.status !== 'READ') && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Thread View - Right Side */}
      <div className="flex-1 bg-card flex flex-col">
        {selectedThreadData ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{selectedThreadData.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedThreadData.participants.filter(p => p !== 'mia@rexera.com').join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setReplyOpen(!replyOpen);
                      setForwardOpen(false); // Close forward if open
                      if (!replyOpen) {
                        // Pre-populate the To field with thread participants
                        setReplyTo(selectedThreadData.participants.filter(p => p !== 'mia@rexera.com').join(', '));
                      }
                    }}
                    className={cn(
                      'p-2 rounded transition-colors',
                      replyOpen 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                    title="Reply to this conversation"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setForwardOpen(!forwardOpen);
                      setReplyOpen(false); // Close reply if open
                      if (!forwardOpen) {
                        // Pre-populate the subject field for forward
                        setForwardSubject(`Fwd: ${selectedThreadData.subject}`);
                        // Pre-populate forward message with thread content
                        const latestEmail = selectedThreadData.emails[selectedThreadData.emails.length - 1];
                        setForwardText(`---------- Forwarded message ----------
From: ${latestEmail.sender}
Date: ${new Date(latestEmail.created_at).toLocaleString()}
Subject: ${latestEmail.subject}
To: ${latestEmail.recipient_email}

${latestEmail.body}`);
                      }
                    }}
                    className={`p-2 rounded transition-colors ${
                      forwardOpen 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    title="Forward this conversation"
                  >
                    <Forward className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-muted-foreground hover:bg-muted rounded"
                    title="Archive this conversation"
                    onClick={() => {
                      // Archive functionality not implemented yet
                      // Archive functionality to be implemented
                    }}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Email Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedThreadData.emails.map((email, index) => (
                <div key={email.id} className={`${
                  email.direction === 'INBOUND' 
                    ? 'mr-8 bg-card border border-border' 
                    : 'ml-8 bg-primary/5 border border-primary/20'
                } rounded-lg p-4`}>
                  
                  {/* Email Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        email.direction === 'INBOUND' 
                          ? 'bg-muted text-muted-foreground' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {email.direction === 'INBOUND' 
                          ? email.sender.charAt(0).toUpperCase()
                          : 'M'
                        }
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {email.direction === 'INBOUND' ? email.sender : 'Mia'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {email.direction === 'INBOUND' ? 'to mia@rexera.com' : `to ${email.recipient_email}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(email.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className={`text-xs ${getStatusColor(email.status)}`}>
                        {email.status.toLowerCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {email.body}
                  </div>
                  
                  {/* Attachments */}
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">Attachments:</div>
                      <div className="space-y-1">
                        {email.attachments.map((attachment, idx) => (
                          <div key={idx} className="text-xs text-primary hover:underline cursor-pointer">
                            📎 {attachment.filename || `Attachment ${idx + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Interface */}
            {replyOpen && selectedThreadData && (
              <div className="border-t border-border bg-muted">
                <div className="p-4">
                  <div className="bg-card rounded-lg border border-border shadow-sm">
                    {/* Reply Header */}
                    <div className="px-4 py-3 border-b border-border bg-muted rounded-t-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            M
                          </div>
                          <div className="text-sm font-medium text-foreground">Reply as Mia</div>
                        </div>
                        <button
                          onClick={() => {
                            setReplyOpen(false);
                            setReplyText('');
                            setReplyTo('');
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Editable To Field */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground min-w-[24px]">To:</label>
                        <input
                          type="email"
                          value={replyTo}
                          onChange={(e) => setReplyTo(e.target.value)}
                          placeholder="Enter recipient email addresses..."
                          className="flex-1 px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
                        />
                      </div>
                    </div>

                    {/* Reply Body */}
                    <div className="p-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={6}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card text-foreground"
                      />
                    </div>

                    {/* Reply Actions */}
                    <div className="px-4 py-3 border-t border-border bg-muted/50 rounded-b-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input 
                            type="checkbox" 
                            checked={replyIncludeTeam}
                            onChange={(e) => setReplyIncludeTeam(e.target.checked)}
                            className="rounded border-border bg-card" 
                          />
                          Send copy to team
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setReplyOpen(false);
                            setReplyText('');
                            setReplyTo('');
                            setReplyIncludeTeam(false);
                          }}
                          disabled={replySending}
                          className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!replyText.trim() || !replyTo.trim() || replySending}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            replyText.trim() && replyTo.trim() && !replySending
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}
                          onClick={handleSendReply}
                        >
                          {replySending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {replySending ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forward Interface */}
            {forwardOpen && selectedThreadData && (
              <div className="border-t border-border bg-muted/50">
                <div className="p-4">
                  <div className="bg-card rounded-lg border border-border shadow-sm">
                    {/* Forward Header */}
                    <div className="px-4 py-3 border-b border-border bg-muted rounded-t-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            M
                          </div>
                          <div className="text-sm font-medium text-foreground">Forward as Mia</div>
                        </div>
                        <button
                          onClick={() => {
                            setForwardOpen(false);
                            setForwardText('');
                            setForwardTo('');
                            setForwardSubject('');
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Forward To Field */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-foreground min-w-[24px]">To:</label>
                        <input
                          type="email"
                          value={forwardTo}
                          onChange={(e) => setForwardTo(e.target.value)}
                          placeholder="Enter recipient email addresses..."
                          className="flex-1 px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
                        />
                      </div>

                      {/* Forward Subject Field */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground min-w-[24px]">Subject:</label>
                        <input
                          type="text"
                          value={forwardSubject}
                          onChange={(e) => setForwardSubject(e.target.value)}
                          placeholder="Enter subject..."
                          className="flex-1 px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
                        />
                      </div>
                    </div>

                    {/* Forward Body */}
                    <div className="p-4">
                      <textarea
                        value={forwardText}
                        onChange={(e) => setForwardText(e.target.value)}
                        placeholder="Add your message above the forwarded content..."
                        rows={10}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm font-mono bg-card text-foreground"
                      />
                    </div>

                    {/* Forward Actions */}
                    <div className="px-4 py-3 border-t border-border bg-muted/50 rounded-b-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input 
                            type="checkbox" 
                            checked={forwardIncludeTeam}
                            onChange={(e) => setForwardIncludeTeam(e.target.checked)}
                            className="rounded border-border bg-card" 
                          />
                          Send copy to team
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setForwardOpen(false);
                            setForwardText('');
                            setForwardTo('');
                            setForwardSubject('');
                            setForwardIncludeTeam(false);
                          }}
                          disabled={forwardSending}
                          className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!forwardText.trim() || !forwardTo.trim() || !forwardSubject.trim() || forwardSending}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            forwardText.trim() && forwardTo.trim() && forwardSubject.trim() && !forwardSending
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}
                          onClick={handleSendForward}
                        >
                          {forwardSending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {forwardSending ? 'Sending...' : 'Forward'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl border w-full max-w-2xl mx-4">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Compose Email</h3>
                <button
                  onClick={() => setComposeOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="email"
                placeholder="To:"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
              />
              <input
                type="text"
                placeholder="Subject:"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
              />
              <textarea
                placeholder="Compose your email..."
                rows={8}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setComposeOpen(false);
                    setComposeTo('');
                    setComposeSubject('');
                    setComposeBody('');
                  }}
                  className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg"
                  disabled={composeSending}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendEmail}
                  disabled={!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || composeSending}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    !composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || composeSending
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {composeSending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {composeSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
