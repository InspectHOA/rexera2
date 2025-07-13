'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Reply, Forward, Archive, Trash2, Send } from 'lucide-react';
import { api } from '@/lib/api/client';

interface EmailInterfaceProps {
  workflowId?: string;
  agentId: string;
}

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

export function EmailInterface({ workflowId, agentId }: EmailInterfaceProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [forwardText, setForwardText] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [forwardSubject, setForwardSubject] = useState('');

  // Fetch real emails from the database
  useEffect(() => {
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
          type: 'email'
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
        // Error is handled by setting empty state
        setEmails([]);
        setThreads([]);
      }
      
      setLoading(false);
    };

    fetchEmails();
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
      case 'read': return 'text-green-600';
      case 'sent': return 'text-blue-600';
      case 'delivered': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'bounced': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <Mail className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Thread List - Left Side */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Compact Header */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Email Threads ({threads.length})</h3>
          <button
            onClick={() => setComposeOpen(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No email conversations yet</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.thread_id}
                onClick={() => setSelectedThread(thread.thread_id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedThread === thread.thread_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                    {thread.subject}
                  </h4>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTimestamp(thread.lastActivity)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 truncate flex-1">
                    {thread.participants.filter(p => p !== 'mia@rexera.com').join(', ')}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {thread.emails.length}
                    </span>
                    {thread.emails.some(e => e.direction === 'INBOUND' && e.status !== 'READ') && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Thread View - Right Side */}
      <div className="flex-1 bg-white flex flex-col">
        {selectedThreadData ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{selectedThreadData.subject}</h3>
                  <p className="text-sm text-gray-600">
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
                    className={`p-2 rounded transition-colors ${
                      replyOpen 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
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
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Forward this conversation"
                  >
                    <Forward className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
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
                    ? 'mr-8' 
                    : 'ml-8 bg-blue-50 border border-blue-100'
                } rounded-lg p-4`}>
                  
                  {/* Email Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        email.direction === 'INBOUND' 
                          ? 'bg-gray-200 text-gray-700' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        {email.direction === 'INBOUND' 
                          ? email.sender.charAt(0).toUpperCase()
                          : 'M'
                        }
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {email.direction === 'INBOUND' ? email.sender : 'Mia'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {email.direction === 'INBOUND' ? 'to mia@rexera.com' : `to ${email.recipient_email}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
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
                  <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {email.body}
                  </div>
                  
                  {/* Attachments */}
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Attachments:</div>
                      <div className="space-y-1">
                        {email.attachments.map((attachment, idx) => (
                          <div key={idx} className="text-xs text-blue-600 hover:underline cursor-pointer">
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
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Reply Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                            M
                          </div>
                          <div className="text-sm font-medium text-gray-900">Reply as Mia</div>
                        </div>
                        <button
                          onClick={() => {
                            setReplyOpen(false);
                            setReplyText('');
                            setReplyTo('');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Editable To Field */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 min-w-[24px]">To:</label>
                        <input
                          type="email"
                          value={replyTo}
                          onChange={(e) => setReplyTo(e.target.value)}
                          placeholder="Enter recipient email addresses..."
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* Reply Actions */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" className="rounded border-gray-300" />
                          Send copy to team
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setReplyOpen(false);
                            setReplyText('');
                            setReplyTo('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!replyText.trim() || !replyTo.trim()}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            replyText.trim() && replyTo.trim()
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (replyText.trim() && replyTo.trim()) {
                              // Reply sending to be implemented
                              // Send reply implementation pending
                              setReplyOpen(false);
                              setReplyText('');
                              setReplyTo('');
                            }
                          }}
                        >
                          <Send className="w-4 h-4" />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forward Interface */}
            {forwardOpen && selectedThreadData && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Forward Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                            M
                          </div>
                          <div className="text-sm font-medium text-gray-900">Forward as Mia</div>
                        </div>
                        <button
                          onClick={() => {
                            setForwardOpen(false);
                            setForwardText('');
                            setForwardTo('');
                            setForwardSubject('');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Forward To Field */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-gray-700 min-w-[24px]">To:</label>
                        <input
                          type="email"
                          value={forwardTo}
                          onChange={(e) => setForwardTo(e.target.value)}
                          placeholder="Enter recipient email addresses..."
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Forward Subject Field */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 min-w-[24px]">Subject:</label>
                        <input
                          type="text"
                          value={forwardSubject}
                          onChange={(e) => setForwardSubject(e.target.value)}
                          placeholder="Enter subject..."
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm font-mono"
                      />
                    </div>

                    {/* Forward Actions */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" className="rounded border-gray-300" />
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
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!forwardText.trim() || !forwardTo.trim() || !forwardSubject.trim()}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                            forwardText.trim() && forwardTo.trim() && forwardSubject.trim()
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (forwardText.trim() && forwardTo.trim() && forwardSubject.trim()) {
                              // Forward sending to be implemented
                              // Forward implementation pending
                              setForwardOpen(false);
                              setForwardText('');
                              setForwardTo('');
                              setForwardSubject('');
                            }
                          }}
                        >
                          <Send className="w-4 h-4" />
                          Forward
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Compose Email</h3>
                <button
                  onClick={() => setComposeOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="email"
                placeholder="To:"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Subject:"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Compose your email..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setComposeOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}