import { Router, Request, Response } from 'express';
import { 
  testN8nConnection, 
  getN8nConfigStatus,
  isN8nEnabled,
  validateN8nConfig
} from '../../utils/n8n';
import { config } from '../../config';

const testN8nRouter = Router();

/**
 * Test n8n API connectivity and configuration
 * GET /api/rest/test-n8n
 */
testN8nRouter.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Testing n8n integration...');

    // Get configuration status
    const configStatus = getN8nConfigStatus();
    
    // Test connection if enabled
    let connectionTest = null;
    let instanceInfo = null;
    let error = null;

    if (isN8nEnabled()) {
      try {
        // Test basic connectivity
        const isConnected = await testN8nConnection();
        connectionTest = {
          success: isConnected,
          timestamp: new Date().toISOString()
        };

        if (isConnected) {
          // Try to get some basic instance information
          try {
            // This is a simple test - we'll try to list workflows with a limit of 1
            const response = await fetch(`${config.n8n.baseUrl}/api/v1/workflows?limit=1`, {
              headers: {
                'X-N8N-API-KEY': config.n8n.apiKey,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              instanceInfo = {
                workflowCount: data.data?.length || 0,
                hasWorkflows: (data.data?.length || 0) > 0,
                apiVersion: 'v1',
                instanceUrl: config.n8n.baseUrl
              };
            }
          } catch (infoError) {
            console.warn('Could not fetch instance info:', infoError);
            instanceInfo = {
              error: 'Could not fetch detailed instance information',
              instanceUrl: config.n8n.baseUrl
            };
          }
        }
      } catch (testError) {
        console.error('n8n connection test failed:', testError);
        connectionTest = {
          success: false,
          error: testError instanceof Error ? testError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
        error = testError instanceof Error ? testError.message : 'Connection test failed';
      }
    } else {
      error = 'n8n integration is not properly configured';
    }

    // Prepare response
    const response = {
      success: true,
      message: 'n8n integration test completed',
      data: {
        configuration: {
          ...configStatus,
          webhookSecret: !!config.n8n.webhookSecret
        },
        connection: connectionTest,
        instance: instanceInfo,
        environment: {
          nodeEnv: config.nodeEnv,
          apiBaseUrl: config.api.baseUrl,
          webhookEndpoint: `${config.api.baseUrl}/api/rest/webhooks/n8n`
        }
      },
      error,
      timestamp: new Date().toISOString()
    };

    // Set appropriate status code
    const statusCode = error ? 200 : 200; // Still 200 since the test endpoint itself worked
    
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Test n8n endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test n8n integration',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get n8n configuration status only
 * GET /api/rest/test-n8n/config
 */
testN8nRouter.get('/config', (req: Request, res: Response) => {
  try {
    const configStatus = getN8nConfigStatus();
    
    res.json({
      success: true,
      message: 'n8n configuration status',
      data: {
        ...configStatus,
        webhookSecret: !!config.n8n.webhookSecret,
        environment: config.nodeEnv,
        webhookEndpoint: `${config.api.baseUrl}/api/rest/webhooks/n8n`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get n8n config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get n8n configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test n8n connection only
 * GET /api/rest/test-n8n/connection
 */
testN8nRouter.get('/connection', async (req: Request, res: Response) => {
  try {
    if (!isN8nEnabled()) {
      return res.json({
        success: false,
        error: 'n8n integration is not enabled or properly configured',
        data: {
          enabled: false,
          configured: validateN8nConfig()
        },
        timestamp: new Date().toISOString()
      });
    }

    const isConnected = await testN8nConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'n8n connection successful' : 'n8n connection failed',
      data: {
        connected: isConnected,
        baseUrl: config.n8n.baseUrl,
        hasApiKey: !!config.n8n.apiKey,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test n8n connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test n8n connection',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { testN8nRouter };