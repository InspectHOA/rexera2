#!/usr/bin/env tsx
/**
 * Script Name: Direct n8n Webhook Test
 * Purpose: Tests the actual n8n webhook endpoint directly
 * Usage: tsx scripts/testing/test-webhook-direct.ts
 * Requirements: None (uses hardcoded webhook URL)
 */

interface TestPayload {
  client_id: string;
  property_address: string;
  loan_number: string;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const testPayload: TestPayload = {
  client_id: 'test-client-001',
  property_address: '123 Direct Test St',
  loan_number: 'DIRECT-TEST-' + Date.now()
};

const webhookUrl = 'https://rexera2.app.n8n.cloud/webhook/payoff-test';

async function testWebhook(): Promise<void> {
  try {
    console.log('🚀 Testing n8n webhook directly...');
    console.log('📤 Payload:', JSON.stringify(testPayload, null, 2));
    console.log('🌐 URL:', webhookUrl);

    const response = await fetchWithTimeout(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 30000
    });

    console.log('\n📥 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📥 Response Body:', responseText);

    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('\n✅ Success! Parsed response:');
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('\n✅ Success! (Non-JSON response)');
      }
    } else {
      console.log('\n❌ Failed with status:', response.status);
      process.exit(1);
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('\n⏰ Request timed out after 30 seconds');
      } else {
        console.log('\n❌ Error:', error.message);
      }
    } else {
      console.log('\n❌ Unknown error:', error);
    }
    process.exit(1);
  }
}

// Add timeout support
async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  if (options.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    options.signal = controller.signal;
    
    return fetch(url, options).finally(() => {
      clearTimeout(timeoutId);
    });
  }
  return fetch(url, options);
}

// Run script if called directly
if (require.main === module) {
  testWebhook();
}