#!/usr/bin/env tsx
/**
 * Script to create a second threaded email conversation between Mia and a lender
 * to test multiple threads in the email interface.
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

async function createSecondThread() {
  console.log('📧 Creating second email thread with lender...');

  try {
    // Create a different thread ID for the lender conversation
    const threadId = randomUUID();
    const baseTime = new Date('2025-07-09T09:00:00Z');

    const lenderConversation = [
      // 1. Initial contact attempt with lender (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'payoffs@firstnationalbank.com',
        subject: 'Payoff Request - Loan #FNB-2024-785421',
        body: `Dear First National Bank Payoff Department,

I am writing on behalf of Rexera Title Services to request a payoff statement for the following loan:

Loan Number: FNB-2024-785421
Borrower: John and Mary Thompson  
Property: 101 Test St, Demo City, ST 10001

Closing Information:
- Anticipated Closing Date: July 16, 2025
- Good Through Date Requested: July 17, 2025

Please provide:
1. Payoff amount as of closing date
2. Per diem interest rate
3. Any unpaid fees or charges
4. Wire transfer instructions for payoff funds

Please send the payoff statement to this email address or fax to (555) 123-4568.

Thank you for your prompt attention to this matter.

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
          loan_number: 'FNB-2024-785421',
          to_name: 'First National Bank'
        },
        created_at: new Date(baseTime.getTime()).toISOString()
      },

      // 2. Automated bounce back - wrong email (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: Payoff Request - Loan #FNB-2024-785421 [DELIVERY FAILURE]',
        body: `DELIVERY FAILURE NOTICE

Your message to payoffs@firstnationalbank.com could not be delivered.

Reason: Mailbox does not exist

Please check the email address and try again, or contact First National Bank at (555) 999-8000 for the correct payoff department email.

This is an automated message from the First National Bank mail system.`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'mailer-daemon@firstnationalbank.com',
          automated: true,
          bounce: true
        },
        created_at: new Date(baseTime.getTime() + 10 * 60 * 1000).toISOString() // 10 minutes later
      },

      // 3. Second attempt with correct email (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'loan.payoffs@firstnationalbank.com',
        subject: 'Re: Payoff Request - Loan #FNB-2024-785421',
        body: `Dear First National Bank Loan Payoff Department,

[SECOND ATTEMPT - Previous email bounced]

I am writing on behalf of Rexera Title Services to request a payoff statement for the following loan:

Loan Number: FNB-2024-785421
Borrower: John and Mary Thompson  
Property: 101 Test St, Demo City, ST 10001

Closing Information:
- Anticipated Closing Date: July 16, 2025
- Good Through Date Requested: July 17, 2025

Please provide:
1. Payoff amount as of closing date
2. Per diem interest rate  
3. Any unpaid fees or charges
4. Wire transfer instructions for payoff funds

Urgent: We need this information by July 12th to meet closing deadlines.

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
          loan_number: 'FNB-2024-785421',
          to_name: 'First National Bank',
          attempt: 2
        },
        created_at: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString() // 30 minutes later
      },

      // 4. Response from lender requiring authorization (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: Payoff Request - Loan #FNB-2024-785421',
        body: `Dear Ms. Chen,

Thank you for your payoff request. We have located the loan account.

However, we cannot release payoff information without proper authorization from the borrower. Please provide one of the following:

1. Signed authorization letter from borrower(s) on title company letterhead
2. Executed purchase agreement showing your company as the closing agent
3. Power of attorney documentation

Additionally, please note:
- Our standard payoff processing time is 3-5 business days
- Rush processing available for $50 fee (24-48 hours)
- All payoff statements are valid for 30 days

Please submit the required authorization via:
- Email: loan.payoffs@firstnationalbank.com  
- Fax: (555) 999-8055
- Secure portal: portal.firstnationalbank.com

Best regards,
Jennifer Walsh
Senior Loan Specialist
First National Bank
jennifer.walsh@firstnationalbank.com
(555) 999-8000 ext. 245`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'jennifer.walsh@firstnationalbank.com',
          authorization_required: true
        },
        created_at: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000).toISOString() // 4 hours later
      },

      // 5. Mia provides authorization and requests rush processing (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'jennifer.walsh@firstnationalbank.com',
        subject: 'Re: Payoff Request - Loan #FNB-2024-785421 - AUTHORIZATION ATTACHED',
        body: `Dear Jennifer,

Thank you for your prompt response. Please find attached:

1. Signed borrower authorization letter on Rexera Title letterhead
2. Executed purchase agreement showing Rexera as closing agent
3. Settlement statement (HUD-1) draft

Given our tight closing timeline (July 16th), we would like to request rush processing with the $50 fee. Please confirm:
- Rush processing fee: $50
- Expected delivery: 24-48 hours
- Payment method for rush fee

We can pay the rush fee via:
- Wire transfer
- Credit card over the phone
- Check (if time permits)

Please confirm receipt of authorization documents and processing timeline.

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
          to_name: 'Jennifer Walsh',
          has_attachments: true,
          rush_requested: true
        },
        created_at: new Date(baseTime.getTime() + 5 * 60 * 60 * 1000).toISOString() // 5 hours later
      },

      // 6. Lender confirms and processes rush request (INBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'mia@rexera.com',
        subject: 'Re: Payoff Request - Loan #FNB-2024-785421 - RUSH PROCESSING APPROVED',
        body: `Dear Mia,

Perfect! All authorization documents received and verified.

Rush processing approved:
✓ Rush fee: $50.00
✓ Processing time: 24 hours 
✓ Expected delivery: Tomorrow by 2:00 PM

Payment for rush fee:
I can take your credit card information over the phone. Please call me directly at (555) 999-8000 ext. 245 between 9 AM - 4 PM EST.

Payoff statement will include:
- Principal balance as of July 16, 2025
- Interest through July 17, 2025  
- Per diem rate: $47.23
- Payoff good through July 17, 2025
- Wire instructions for loan payoff

I'll start processing immediately once payment is received.

Best regards,
Jennifer Walsh
Senior Loan Specialist
First National Bank`,
        communication_type: 'email',
        direction: 'INBOUND',
        status: 'READ',
        metadata: {
          from_email: 'jennifer.walsh@firstnationalbank.com',
          rush_approved: true,
          rush_fee: 50
        },
        created_at: new Date(baseTime.getTime() + 6 * 60 * 60 * 1000).toISOString() // 6 hours later
      },

      // 7. Follow-up on payment (OUTBOUND)
      {
        workflow_id: WORKFLOW_ID,
        thread_id: threadId,
        sender_id: null,
        recipient_email: 'jennifer.walsh@firstnationalbank.com',
        subject: 'Re: Payoff Request - Loan #FNB-2024-785421 - PAYMENT TO FOLLOW',
        body: `Dear Jennifer,

Thank you for the quick approval! 

I will call you at (555) 999-8000 ext. 245 within the next hour to process the $50 rush fee payment.

Just to confirm the timeline:
- Payment today (July 9th)
- Payoff statement delivered by 2:00 PM tomorrow (July 10th)
- Statement good through July 17th, 2025

Looking forward to speaking with you shortly.

Best regards,
Mia Chen`,
        communication_type: 'email',
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: {
          to_name: 'Jennifer Walsh',
          payment_pending: true
        },
        created_at: new Date(baseTime.getTime() + 6.5 * 60 * 60 * 1000).toISOString() // 6.5 hours later
      }
    ];

    // Insert the second threaded conversation
    for (const email of lenderConversation) {
      const { error: insertError } = await supabase
        .from('communications')
        .insert(email);

      if (insertError) {
        console.error('❌ Failed to insert email:', insertError.message);
      } else {
        console.log(`✅ Added ${email.direction} email: "${email.subject.substring(0, 50)}..."`);
      }
    }

    console.log('\n🎉 Second email thread created successfully!');
    console.log(`📧 Created ${lenderConversation.length} emails in lender thread`);
    console.log('🔗 Test at: http://localhost:3000/workflow/08425833-088a-4e3e-83da-7f0f4661791c');
    console.log('\nNow you have TWO threads:');
    console.log('1. HOA conversation (9 emails)');
    console.log('2. Lender conversation (7 emails)');
    console.log('\nTo view both threads:');
    console.log('1. Select a Mia task');
    console.log('2. Click on "🤖 Mia Interface" tab');
    console.log('3. See both threads in the thread list');
    console.log('4. Click between threads to see different conversations');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createSecondThread();
}