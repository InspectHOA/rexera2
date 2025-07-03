/**
 * Iris - Document Processing Specialist
 * Handles OCR, document extraction, and data analysis
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface IrisCapabilities {
  ocrProcessing: (params: OCRParams) => Promise<OCRResult>;
  dataExtraction: (params: DataExtractionParams) => Promise<DataExtractionResult>;
  documentClassification: (params: ClassificationParams) => Promise<ClassificationResult>;
  contentAnalysis: (params: ContentAnalysisParams) => Promise<ContentAnalysisResult>;
}

export interface OCRParams {
  documentSource: {
    type: 'file_path' | 'url' | 'base64';
    value: string;
  };
  documentType: 'pdf' | 'image' | 'scanned_document';
  ocrSettings: {
    language: string;
    dpi?: number;
    enhancement: boolean;
    confidenceThreshold: number;
  };
}

export interface OCRResult {
  extractedText: string;
  confidence: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    boundingBoxes?: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }>;
  metadata: {
    pageCount: number;
    processingTime: number;
    fileSize: number;
  };
}

export interface DataExtractionParams {
  documentText: string;
  extractionType: 'structured_data' | 'key_value_pairs' | 'tables' | 'forms' | 'custom';
  schema?: {
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'date' | 'boolean';
      required: boolean;
      pattern?: string;
    }>;
  };
  customRules?: Array<{
    field: string;
    pattern: string;
    context?: string;
  }>;
}

export interface DataExtractionResult {
  extractedData: Record<string, any>;
  confidence: number;
  fieldConfidences: Record<string, number>;
  warnings: string[];
  tables?: Array<{
    headers: string[];
    rows: string[][];
    confidence: number;
  }>;
}

export interface ClassificationParams {
  documentContent: string;
  classificationTypes: Array<'document_type' | 'legal_category' | 'urgency' | 'completeness' | 'custom'>;
  customCategories?: Array<{
    name: string;
    description: string;
    keywords: string[];
  }>;
}

export interface ClassificationResult {
  documentType: {
    category: string;
    subcategory?: string;
    confidence: number;
  };
  classifications: Array<{
    type: string;
    value: string;
    confidence: number;
    reasoning: string;
  }>;
  metadata: {
    language: string;
    pageCount: number;
    wordCount: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface ContentAnalysisParams {
  documentContent: string;
  analysisGoals: Array<'key_information' | 'compliance_check' | 'risk_assessment' | 'entity_extraction'>;
  domain: 'real_estate' | 'legal' | 'financial' | 'general';
  customEntities?: string[];
}

export interface ContentAnalysisResult {
  keyInformation: Array<{
    category: string;
    information: string;
    importance: 'low' | 'medium' | 'high';
    location: string;
  }>;
  entities: Array<{
    type: 'person' | 'organization' | 'location' | 'date' | 'amount' | 'custom';
    value: string;
    confidence: number;
    context: string;
  }>;
  complianceIssues?: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  riskFactors?: Array<{
    factor: string;
    description: string;
    likelihood: number;
    impact: number;
  }>;
  summary: string;
}

export class IrisAgent extends BaseAgentSDK implements IrisCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Iris-Agent/1.0.0',
    });
  }

  async ocrProcessing(params: OCRParams): Promise<OCRResult> {
    const request: AgentTaskRequest = {
      agent_type: 'iris',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'ocr_processing',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('iris', request);
    return response.result_data as OCRResult;
  }

  async dataExtraction(params: DataExtractionParams): Promise<DataExtractionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'iris',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'data_extraction',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('iris', request);
    return response.result_data as DataExtractionResult;
  }

  async documentClassification(params: ClassificationParams): Promise<ClassificationResult> {
    const request: AgentTaskRequest = {
      agent_type: 'iris',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'document_classification',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('iris', request);
    return response.result_data as ClassificationResult;
  }

  async contentAnalysis(params: ContentAnalysisParams): Promise<ContentAnalysisResult> {
    const request: AgentTaskRequest = {
      agent_type: 'iris',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'content_analysis',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('iris', request);
    return response.result_data as ContentAnalysisResult;
  }

  /**
   * High-level document processing workflows
   */
  async processDocument(
    documentPath: string,
    processingOptions: {
      extractData: boolean;
      classify: boolean;
      analyze: boolean;
      schema?: any;
    }
  ): Promise<{
    ocr: OCRResult;
    extraction?: DataExtractionResult;
    classification?: ClassificationResult;
    analysis?: ContentAnalysisResult;
  }> {
    // First, perform OCR
    const ocrResult = await this.ocrProcessing({
      documentSource: {
        type: 'file_path',
        value: documentPath,
      },
      documentType: 'pdf',
      ocrSettings: {
        language: 'en',
        enhancement: true,
        confidenceThreshold: 0.8,
      },
    });

    const results: any = { ocr: ocrResult };

    // Extract structured data if requested
    if (processingOptions.extractData) {
      results.extraction = await this.dataExtraction({
        documentText: ocrResult.extractedText,
        extractionType: 'structured_data',
        schema: processingOptions.schema,
      });
    }

    // Classify document if requested
    if (processingOptions.classify) {
      results.classification = await this.documentClassification({
        documentContent: ocrResult.extractedText,
        classificationTypes: ['document_type', 'legal_category', 'completeness'],
      });
    }

    // Analyze content if requested
    if (processingOptions.analyze) {
      results.analysis = await this.contentAnalysis({
        documentContent: ocrResult.extractedText,
        analysisGoals: ['key_information', 'entity_extraction', 'compliance_check'],
        domain: 'real_estate',
      });
    }

    return results;
  }
}

export const iris = new IrisAgent();