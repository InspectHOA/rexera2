#!/usr/bin/env tsx
/**
 * Script to create a realistic threaded email conversation between Mia and an HOA
 * to test the threaded email interface.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Load environment variables
config({ path: './serverless-api/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WORKFLOW_ID = '08425833-088a-4e3e-83da-7f0f4661791c';

async function createThreadedEmails() {
  console.log('📧 Creating threaded email conversation...');

  try {
    // Clear existing communications for this workflow
    const { error: deleteError } = await supabase
      .from('communications')
      .delete()
      .eq('workflow_id', WORKFLOW_ID);

    if (deleteError) {
      console.warn('Warning: Could not clear existing communications:', deleteError.message);
    }

    // Create a thread ID for the conversation
    const threadId = randomUUID();
    const baseTime = new Date('2025-07-08T10:00:00Z');

    const emailConversation = [
      // 1. Initial request from Mia to HOA (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'documents@greenwoodhoa.com',
        subject: 'HOA Documents Request - Property at 101 Test St',
        body: `Dear Greenwood HOA Management,

I hope this email finds you well. I am writing on behalf of Rexera Title Services regarding the property located at 101 Test St, Demo City, ST 10001.

We are currently processing a real estate transaction for this property and require the following HOA documents:

1. Current HOA statement showing any outstanding balances
2. Estoppel certificate
3. List of any pending special assessments
4. Transfer fee information and requirements
5. CC&Rs and current bylaws

The anticipated closing date is July 16, 2025, so we would appreciate receiving these documents by July 12, 2025.

Please let me know if you need any additional information or if there are any fees associated with providing these documents.

Thank you for your assistance.

Best regards,
Mia Chen
Email Communication Specialist
Rexera Title Services
mia@rexera.com
(555) 123-4567`,
        communication_type: 'email',
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: {
          to_name: 'Greenwood HOA Management',
          priority: 'normal'
        },
        created_at: new Date(baseTime.getTime()).toISOString()
      },

      // 2. Auto-reply from HOA (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St',
        body: `Thank you for contacting Greenwood HOA Management.

This is an automated response to confirm we have received your email. Our typical response time is 1-2 business days.

For urgent matters, please call our office at (555) 987-6543.

Best regards,
Greenwood HOA Management Team`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'noreply@greenwoodhoa.com',
          automated: true
        },
        created_at: new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString() // 15 minutes later
      },

      // 3. Response from HOA manager (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St',
        body: `Dear Mia,

Thank you for your request. I can provide most of the documents you need, however I have a few questions:

1. Can you confirm the exact unit number? We show both 101A and 101B in our system.
2. Who is the current owner of record? We need to verify before releasing financial information.
3. Do you need documents in digital format or hard copies mailed?

The fees for document preparation are:
- Estoppel Certificate: $150
- Document package: $75
- Rush processing (under 48 hours): Additional $50

Please provide the missing information and we can process your request promptly.

Best regards,
Sarah Martinez
HOA Manager
Greenwood HOA Management
sarah.martinez@greenwoodhoa.com
(555) 987-6543 ext. 102`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'sarah.martinez@greenwoodhoa.com'
        },
        created_at: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000).toISOString() // 4 hours later
      },

      // 4. Mia's response with requested information (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'sarah.martinez@greenwoodhoa.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St',
        body: `Dear Sarah,

Thank you for your quick response. Here are the details you requested:

1. Unit number: 101A (confirmed with the buyer's agent)
2. Current owner of record: John and Mary Thompson
3. Format: Digital format preferred (PDF via email)

We would like to proceed with rush processing given our tight timeline. Please confirm the total fee of $275 ($150 + $75 + $50) and provide payment instructions.

Can you also confirm you'll be able to deliver the documents by July 12th as requested?

Best regards,
Mia Chen
Email Communication Specialist
Rexera Title Services
mia@rexera.com
(555) 123-4567`,
        communication_type: 'email',
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: {
          to_name: 'Sarah Martinez'
        },
        created_at: new Date(baseTime.getTime() + 5 * 60 * 60 * 1000).toISOString() // 5 hours later
      },

      // 5. Sarah confirms and provides payment info (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St',
        body: `Dear Mia,

Perfect! I can confirm delivery by July 12th with rush processing.

Total fee: $275.00

Payment options:
1. Credit card over the phone: (555) 987-6543 ext. 102
2. Check made out to "Greenwood HOA Management" 
   Mailed to: 500 Management Way, Demo City, ST 10001
3. Zelle: payments@greenwoodhoa.com

Once payment is received, I will prepare the complete document package for unit 101A. This will include:
✓ Current account statement (as of today)
✓ Estoppel certificate 
✓ Pending assessments report (currently none)
✓ Transfer fee schedule
✓ CC&Rs (amended 2023)
✓ Current bylaws

Would you prefer to pay by card over the phone for fastest processing?

Best regards,
Sarah Martinez
HOA Manager`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'sarah.martinez@greenwoodhoa.com'
        },
        created_at: new Date(baseTime.getTime() + 6 * 60 * 60 * 1000).toISOString() // 6 hours later
      },

      // 6. Mia arranges payment (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'sarah.martinez@greenwoodhoa.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St',
        body: `Dear Sarah,

Excellent! I'll call you within the next hour to process the credit card payment.

Just to confirm the timeline:
- Payment today (July 8th)
- Documents delivered by July 12th
- Rush processing included

I'll call (555) 987-6543 ext. 102 shortly.

Thank you for your excellent service!

Best regards,
Mia Chen`,
        communication_type: 'email',
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: {
          to_name: 'Sarah Martinez'
        },
        created_at: new Date(baseTime.getTime() + 6.5 * 60 * 60 * 1000).toISOString() // 6.5 hours later
      },

      // 7. Payment confirmation (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St - PAYMENT CONFIRMED',
        body: `Dear Mia,

Payment confirmed! $275.00 processed successfully.
Transaction ID: HOA-2025-07-08-1547

I'm starting on the document preparation immediately. You can expect delivery by Friday, July 11th (one day early).

I'll send a follow-up email when the documents are ready for delivery.

Best regards,
Sarah Martinez
HOA Manager`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'sarah.martinez@greenwoodhoa.com',
          transaction_id: 'HOA-2025-07-08-1547'
        },
        created_at: new Date(baseTime.getTime() + 8 * 60 * 60 * 1000).toISOString() // 8 hours later
      },

      // 8. Documents ready notification (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St - DOCUMENTS READY',
        body: `Dear Mia,

Great news! Your HOA document package for 101A Test St is ready.

Document package includes:
📄 Account Statement (current balance: $0.00)
📄 Estoppel Certificate (signed and notarized)
📄 Assessment Report (no pending assessments)
📄 Transfer Fee Schedule ($150 due at closing)
📄 CC&Rs (12 pages)
📄 Bylaws (8 pages)

Documents are attached as separate PDFs. Please confirm receipt.

The estoppel certificate is valid for 30 days from today's date.

Please don't hesitate to contact me if you need any clarification on these documents.

Best regards,
Sarah Martinez
HOA Manager
Greenwood HOA Management`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'sarah.martinez@greenwoodhoa.com',
          has_attachments: true,
          attachment_count: 6
        },
        created_at: new Date(baseTime.getTime() + 26 * 60 * 60 * 1000).toISOString() // 26 hours later (next day)
      },

      // 9. Mia confirms receipt (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'sarah.martinez@greenwoodhoa.com',
        subject: 'Re: HOA Documents Request - Property at 101 Test St - DOCUMENTS RECEIVED',
        body: `Dear Sarah,

Perfect! I have received all the documents and they look complete.

Thank you for the excellent service and for delivering ahead of schedule. This will help ensure a smooth closing for our clients.

I've forwarded the documents to our closing team and the buyer's attorney.

We appreciate your professionalism and efficiency.

Best regards,
Mia Chen
Email Communication Specialist
Rexera Title Services`,
        communication_type: 'email',
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: {
          to_name: 'Sarah Martinez',
          completion: true
        },
        created_at: new Date(baseTime.getTime() + 27 * 60 * 60 * 1000).toISOString() // 27 hours later
      }
    ];

    // Insert the threaded conversation
    for (const email of emailConversation) {
      const { error: insertError } = await supabase
        .from('communications')
        .insert(email);

      if (insertError) {
        console.error('❌ Failed to insert email:', insertError.message);
      } else {
        console.log(`✅ Added ${email.direction} email: "${email.subject.substring(0, 50)}..."`);
      }
    }

    console.log('\n🎉 Threaded email conversation created successfully!');
    console.log(`📧 Created ${emailConversation.length} emails in thread`);
    console.log('🔗 Test at: http://localhost:3000/workflow/08425833-088a-4e3e-83da-7f0f4661791c');
    console.log('\nTo view the conversation:');
    console.log('1. Select a Mia task (Identify Lender Contact or Send Payoff Request)');
    console.log('2. Click on "🤖 Mia Interface" tab');
    console.log('3. View the threaded conversation with the HOA');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createThreadedEmails();
}