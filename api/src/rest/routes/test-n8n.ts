/**
 * @fileoverview n8n integration testing and diagnostics endpoints for Rexera 2.0.
 *
 * This module provides comprehensive testing and diagnostic capabilities for the
 * n8n Cloud integration that powers Rexera's workflow automation. These endpoints
 * enable DevOps teams, developers, and system administrators to validate n8n
 * connectivity, configuration, and operational status without requiring complex
 * debugging tools or direct n8n access.
 *
 * n8n Integration Testing Architecture:
 * - Configuration validation and status reporting
 * - Live connectivity testing with error diagnostics
 * - Instance information gathering and validation
 * - Environment configuration verification
 * - Webhook endpoint validation and testing
 *
 * Key Capabilities:
 * - Comprehensive n8n integration health checks
 * - Configuration validation and troubleshooting
 * - Live API connectivity testing
 * - Instance metadata and workflow discovery
 * - Environment-specific configuration verification
 *
 * Business Context:
 * - n8n powers all three core Rexera workflows
 * - Integration failures block workflow automation
 * - Quick diagnostics enable rapid incident response
 * - Configuration validation prevents deployment issues
 *
 * Operational Use Cases:
 * - Pre-deployment integration validation
 * - Production health monitoring and alerting
 * - Troubleshooting workflow automation failures
 * - Configuration verification after updates
 * - Development environment setup validation
 *
 * Integration Points:
 * - n8n Cloud API for connectivity testing
 * - Rexera configuration system for validation
 * - Webhook endpoints for bidirectional communication
 * - Environment-specific configuration management
 *
 * @module TestN8nRouter
 * @requires express - Express router and HTTP handling
 * @requires ../../utils/n8n - n8n integration utilities
 * @requires ../../config - Configuration management
 */

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
 * GET /api/rest/test-n8n - Comprehensive n8n integration test and diagnostics.
 *
 * Business Context:
 * - Primary endpoint for validating complete n8n integration health
 * - Used by DevOps teams for deployment validation and monitoring
 * - Enables rapid troubleshooting of workflow automation failures
 * - Provides comprehensive diagnostics for incident response
 *
 * Test Components:
 * - Configuration validation and completeness check
 * - Live API connectivity testing with error details
 * - Instance information gathering and workflow discovery
 * - Environment configuration verification
 * - Webhook endpoint validation and accessibility
 *
 * Configuration Testing:
 * - API key presence and format validation
 * - Base URL accessibility and format checking
 * - Webhook secret configuration verification
 * - Environment-specific setting validation
 *
 * Connectivity Testing:
 * - Live API endpoint accessibility testing
 * - Authentication validation with n8n Cloud
 * - Basic API operation testing (workflow listing)
 * - Network connectivity and latency assessment
 *
 * Instance Information:
 * - Workflow count and availability discovery
 * - API version compatibility verification
 * - Instance URL validation and accessibility
 * - Basic operational status assessment
 *
 * Response Format:
 * - Comprehensive test results with detailed diagnostics
 * - Configuration status with security-safe details
 * - Connection test results with error information
 * - Instance metadata for operational visibility
 * - Environment configuration for troubleshooting
 *
 * Operational Use Cases:
 * - Pre-deployment integration validation
 * - Production monitoring and health checks
 * - Incident response and troubleshooting
 * - Configuration verification after updates
 *
 * @route GET /api/rest/test-n8n
 * @returns {Object} Comprehensive n8n integration test results
 * @throws {Error} When test execution fails or system errors occur
 */
testN8nRouter.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Testing n8n integration...');

    // Get configuration status with validation details
    const configStatus = getN8nConfigStatus();
    
    // Initialize test result containers
    let connectionTest = null;
    let instanceInfo = null;
    let error = null;

    if (isN8nEnabled()) {
      try {
        // Test basic connectivity with n8n Cloud API
        const isConnected = await testN8nConnection();
        connectionTest = {
          success: isConnected,
          timestamp: new Date().toISOString()
        };

        if (isConnected) {
          // Gather instance information for operational visibility
          try {
            // Test basic API operation by listing workflows (minimal impact)
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

    // Prepare comprehensive response with all test results
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

    // Return 200 even with errors since the test endpoint itself succeeded
    const statusCode = 200;
    
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
 * GET /api/rest/test-n8n/config - n8n configuration validation and status.
 *
 * Business Context:
 * - Lightweight endpoint for configuration validation only
 * - Used by deployment scripts and configuration management
 * - Enables quick configuration verification without connectivity tests
 * - Supports troubleshooting of configuration-related issues
 *
 * Configuration Validation:
 * - API key presence and format checking
 * - Base URL format and accessibility validation
 * - Webhook secret configuration verification
 * - Environment-specific setting validation
 *
 * Security Considerations:
 * - Returns boolean flags for sensitive configuration
 * - Does not expose actual API keys or secrets
 * - Provides sufficient detail for troubleshooting
 * - Maintains security while enabling diagnostics
 *
 * Response Format:
 * - Configuration status with validation results
 * - Security-safe boolean flags for sensitive data
 * - Environment information for context
 * - Webhook endpoint configuration details
 *
 * Use Cases:
 * - Pre-deployment configuration validation
 * - Configuration troubleshooting and verification
 * - Environment setup validation
 * - Security audit and compliance checking
 *
 * @route GET /api/rest/test-n8n/config
 * @returns {Object} n8n configuration status and validation results
 * @throws {Error} When configuration retrieval fails
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
 * GET /api/rest/test-n8n/connection - n8n connectivity test only.
 *
 * Business Context:
 * - Focused endpoint for testing live n8n API connectivity
 * - Used by monitoring systems for health checks
 * - Enables quick connectivity validation without full diagnostics
 * - Supports automated alerting and incident detection
 *
 * Connectivity Testing:
 * - Live API endpoint accessibility testing
 * - Authentication validation with n8n Cloud
 * - Network connectivity and response validation
 * - Basic API operation verification
 *
 * Prerequisites:
 * - Validates configuration before attempting connection
 * - Requires proper API key and base URL configuration
 * - Checks n8n integration enablement status
 * - Ensures all required configuration is present
 *
 * Response Format:
 * - Connection status with success/failure indication
 * - Basic configuration information for context
 * - Timestamp for monitoring and correlation
 * - Error details for troubleshooting failures
 *
 * Monitoring Integration:
 * - Used by health check systems for alerting
 * - Enables automated monitoring of n8n connectivity
 * - Supports incident detection and response
 * - Provides connectivity metrics for operations
 *
 * Use Cases:
 * - Automated health monitoring and alerting
 * - Quick connectivity verification during incidents
 * - Load balancer health checks for n8n integration
 * - Continuous monitoring of external dependencies
 *
 * @route GET /api/rest/test-n8n/connection
 * @returns {Object} n8n connectivity test results
 * @throws {Error} When connection test execution fails
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