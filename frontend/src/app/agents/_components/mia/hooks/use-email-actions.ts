/**
 * Email actions hook for MIA agent.
 * Handles compose, reply, forward operations and form state.
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';

interface EmailActionState {
  isOpen: boolean;
  text: string;
  recipient: string;
  subject: string;
  isSubmitting: boolean;
  error: string | null;
}

interface UseEmailActionsOptions {
  workflowId?: string;
  onEmailSent?: () => void;
}

export function useEmailActions({ 
  workflowId, 
  onEmailSent 
}: UseEmailActionsOptions) {
  // Compose state
  const [compose, setCompose] = useState<EmailActionState>({
    isOpen: false,
    text: '',
    recipient: '',
    subject: '',
    isSubmitting: false,
    error: null,
  });

  // Reply state
  const [reply, setReply] = useState<EmailActionState>({
    isOpen: false,
    text: '',
    recipient: '',
    subject: '',
    isSubmitting: false,
    error: null,
  });

  // Forward state
  const [forward, setForward] = useState<EmailActionState>({
    isOpen: false,
    text: '',
    recipient: '',
    subject: '',
    isSubmitting: false,
    error: null,
  });

  // Compose actions
  const openCompose = () => {
    setCompose(prev => ({
      ...prev,
      isOpen: true,
      text: '',
      recipient: '',
      subject: '',
      error: null,
    }));
  };

  const closeCompose = () => {
    setCompose(prev => ({
      ...prev,
      isOpen: false,
      text: '',
      recipient: '',
      subject: '',
      error: null,
    }));
  };

  const updateCompose = (updates: Partial<EmailActionState>) => {
    setCompose(prev => ({ ...prev, ...updates }));
  };

  const sendCompose = async () => {
    if (!workflowId) {
      setCompose(prev => ({ ...prev, error: 'Workflow ID is required' }));
      return false;
    }

    if (!compose.recipient || !compose.subject || !compose.text) {
      setCompose(prev => ({ ...prev, error: 'All fields are required' }));
      return false;
    }

    setCompose(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await api.communications.create({
        workflow_id: workflowId,
        recipient_email: compose.recipient,
        subject: compose.subject,
        body: compose.text,
        communication_type: 'email',
        direction: 'OUTBOUND',
      });

      closeCompose();
      onEmailSent?.();
      return true;
    } catch (error) {
      setCompose(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }));
      return false;
    } finally {
      setCompose(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Reply actions
  const openReply = (originalEmail: {
    sender: string;
    subject: string;
    body?: string;
  }) => {
    setReply(prev => ({
      ...prev,
      isOpen: true,
      recipient: originalEmail.sender,
      subject: originalEmail.subject.startsWith('Re: ') 
        ? originalEmail.subject 
        : `Re: ${originalEmail.subject}`,
      text: originalEmail.body ? `\n\n--- Original Message ---\n${originalEmail.body}` : '',
      error: null,
    }));
  };

  const closeReply = () => {
    setReply(prev => ({
      ...prev,
      isOpen: false,
      text: '',
      recipient: '',
      subject: '',
      error: null,
    }));
  };

  const updateReply = (updates: Partial<EmailActionState>) => {
    setReply(prev => ({ ...prev, ...updates }));
  };

  const sendReply = async () => {
    if (!workflowId) {
      setReply(prev => ({ ...prev, error: 'Workflow ID is required' }));
      return false;
    }

    if (!reply.recipient || !reply.subject || !reply.text) {
      setReply(prev => ({ ...prev, error: 'All fields are required' }));
      return false;
    }

    setReply(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await api.communications.create({
        workflow_id: workflowId,
        recipient_email: reply.recipient,
        subject: reply.subject,
        body: reply.text,
        communication_type: 'email',
        direction: 'OUTBOUND',
      });

      closeReply();
      onEmailSent?.();
      return true;
    } catch (error) {
      setReply(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send reply'
      }));
      return false;
    } finally {
      setReply(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Forward actions
  const openForward = (originalEmail: {
    sender: string;
    subject: string;
    body?: string;
  }) => {
    setForward(prev => ({
      ...prev,
      isOpen: true,
      recipient: '',
      subject: originalEmail.subject.startsWith('Fwd: ') 
        ? originalEmail.subject 
        : `Fwd: ${originalEmail.subject}`,
      text: originalEmail.body 
        ? `\n\n--- Forwarded Message ---\nFrom: ${originalEmail.sender}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body}`
        : '',
      error: null,
    }));
  };

  const closeForward = () => {
    setForward(prev => ({
      ...prev,
      isOpen: false,
      text: '',
      recipient: '',
      subject: '',
      error: null,
    }));
  };

  const updateForward = (updates: Partial<EmailActionState>) => {
    setForward(prev => ({ ...prev, ...updates }));
  };

  const sendForward = async () => {
    if (!workflowId) {
      setForward(prev => ({ ...prev, error: 'Workflow ID is required' }));
      return false;
    }

    if (!forward.recipient || !forward.subject || !forward.text) {
      setForward(prev => ({ ...prev, error: 'All fields are required' }));
      return false;
    }

    setForward(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await api.communications.create({
        workflow_id: workflowId,
        recipient_email: forward.recipient,
        subject: forward.subject,
        body: forward.text,
        communication_type: 'email',
        direction: 'OUTBOUND',
      });

      closeForward();
      onEmailSent?.();
      return true;
    } catch (error) {
      setForward(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to forward email'
      }));
      return false;
    } finally {
      setForward(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Archive/Delete actions (for future implementation)
  const archiveEmail = async (emailId: string) => {
    // TODO: Implement archive functionality when backend supports it
    console.log('Archive email:', emailId);
  };

  const deleteEmail = async (emailId: string) => {
    // TODO: Implement delete functionality when backend supports it
    console.log('Delete email:', emailId);
  };

  return {
    // State
    compose,
    reply,
    forward,
    
    // Compose actions
    openCompose,
    closeCompose,
    updateCompose,
    sendCompose,
    
    // Reply actions
    openReply,
    closeReply,
    updateReply,
    sendReply,
    
    // Forward actions
    openForward,
    closeForward,
    updateForward,
    sendForward,
    
    // Other actions
    archiveEmail,
    deleteEmail,
  };
}