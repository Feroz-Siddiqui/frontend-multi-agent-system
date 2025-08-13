/**
 * Enhanced Execution Result Types
 * 
 * TypeScript interfaces that exactly match backend Pydantic models
 * Provides proper typing for agent results and Tavily data
 */

import type { TavilyUnifiedResponse } from '../../../types/tavily.types';

// ============================================================================
// STRUCTURED AGENT RESULT DATA TYPES (matches backend structured_results.py)
// ============================================================================

/**
 * Structured LLM Response (matches backend LLMResponse model)
 */
export interface LLMResponse {
  content: string;
  key_points: string[];
  summary: string;
  confidence: number;
  has_structured_content: boolean;
  word_count: number;
  contains_recommendations: boolean;
  contains_data: boolean;
  contains_sources: boolean;
}

/**
 * Tavily Source (matches backend TavilySource model)
 */
export interface TavilySource {
  title: string;
  url?: string; // URL might be missing in some cases
  content_preview: string;
  relevance_score: number;
  source_type?: 'search' | 'extract' | 'crawl'; // Might be inferred
  favicon_url?: string | null;
  favicon?: string; // Alternative favicon field
  content_length: number;
  raw_content?: string; // Raw content from extract/crawl APIs
  images?: string[]; // Array of image URLs
  depth?: number; // Crawl depth for crawl results
  parent_url?: string; // Parent URL for crawl results
}

/**
 * Structured Tavily Results (matches backend TavilyResults model)
 */
export interface TavilyResults {
  search?: {
    query: string;
    answer?: string;
    sources: TavilySource[];
    total_results: number;
    response_time: number;
    has_answer: boolean;
  };
  extract?: {
    sources: TavilySource[];
    total_extractions: number;
    failed_extractions: number;
    response_time: number;
    total_content_length: number;
  };
  crawl?: {
    base_url: string;
    sources: TavilySource[];
    total_pages: number;
    max_depth_reached: number;
    response_time: number;
  };
  map?: {
    base_url: string;
    discovered_urls: string[];
    total_urls: number;
    response_time: number;
    url_categories: Record<string, number>;
  };
  total_sources: number;
  total_credits_used: number;
  apis_used: string[];
  total_response_time: number;
  successful_apis: number;
  failed_apis: number;
  has_results: boolean;
}

/**
 * Structured Agent Result Data (matches backend processed format)
 */
export interface StructuredAgentResultData {
  // Structured content (NEW format from backend)
  llm_response?: LLMResponse;
  tavily_results?: TavilyResults;
  key_findings: string[];
  recommendations: string[];
  data_points: string[];
  all_sources: TavilySource[];
  
  // Raw data for debugging
  raw_llm_response?: string;
  raw_tavily_data?: Record<string, unknown>;
  execution_context?: ExecutionContext;
}

/**
 * Legacy Agent Result Data Structure (for backward compatibility)
 * Matches backend: agent_result.result = { llm_response, tavily_data, context_used, confidence }
 */
export interface LegacyAgentResultData {
  llm_response: string;
  tavily_data: TavilyExecutionResult;
  context_used: ExecutionContext;
  confidence: number;
}

// Type alias for current format
export type AgentResultData = StructuredAgentResultData;

/**
 * Tavily Execution Result
 * Matches backend tavily_executor.py return structure
 */
export interface TavilyExecutionResult {
  results: TavilyApiResults;
  formatted_data: string;
  credits_used: number;
  apis_used: string[];
  success: boolean;
  error?: string;
  fallback_used?: boolean;
}

/**
 * Combined Tavily API Results
 * Contains responses from all enabled Tavily APIs
 */
export interface TavilyApiResults {
  search?: TavilyUnifiedResponse;
  extract?: TavilyUnifiedResponse;
  crawl?: TavilyUnifiedResponse;
  map?: TavilyUnifiedResponse;
}

/**
 * Execution Context
 * Context data used during agent execution
 */
export interface ExecutionContext {
  query: string;
  execution_id: string;
  agent_id: string;
  agent_name: string;
  previous_results: Record<string, AgentResultData>;
  [key: string]: unknown; // Allow additional context fields
}

// ============================================================================
// ENHANCED AGENT RESULT TYPE
// ============================================================================

/**
 * Enhanced Agent Result with proper typing
 * Updates the generic Record<string, unknown> to structured AgentResultData
 */
export interface EnhancedAgentResult {
  agent_id: string;
  agent_name: string;
  success: boolean;
  result?: AgentResultData;  // Properly typed instead of Record<string, unknown>
  error?: string;
  cost: number;
  duration_seconds: number;
  confidence_score: number;
  tokens_used: number;
  tavily_calls: number;
  tavily_credits: number;
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// PARSED CONTENT TYPES FOR UI DISPLAY
// ============================================================================

/**
 * Parsed LLM Response for UI display
 */
export interface ParsedLLMResponse {
  content: string;
  keyPoints: string[];
  summary: string;
  confidence: number;
  hasStructuredContent: boolean;
}

/**
 * Parsed Tavily Search Results for UI display
 */
export interface ParsedTavilySearch {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    content: string;
    url: string;
    score: number;
    relevance: 'high' | 'medium' | 'low';
    favicon?: string;
  }>;
  totalResults: number;
  responseTime: number;
}

/**
 * Parsed Tavily Extract Results for UI display
 */
export interface ParsedTavilyExtract {
  results: Array<{
    title?: string;
    content: string;
    url: string;
    contentLength: number;
    hasImages: boolean;
    imageCount: number;
  }>;
  totalExtractions: number;
  failedExtractions: number;
  responseTime: number;
}

/**
 * Parsed Tavily Crawl Results for UI display
 */
export interface ParsedTavilyCrawl {
  baseUrl: string;
  results: Array<{
    url: string;
    content: string;
    title?: string;
    depth: number;
    parentUrl?: string;
    contentLength: number;
  }>;
  totalPages: number;
  maxDepth: number;
  responseTime: number;
}

/**
 * Parsed Tavily Map Results for UI display
 */
export interface ParsedTavilyMap {
  baseUrl: string;
  urls: Array<{
    url: string;
    depth?: number;
    category: 'page' | 'resource' | 'external';
  }>;
  totalUrls: number;
  responseTime: number;
}

/**
 * Complete Parsed Agent Result for UI components
 */
export interface ParsedAgentResult {
  // Basic info
  agentId: string;
  agentName: string;
  success: boolean;
  error?: string;
  
  // Performance metrics
  cost: number;
  duration: number;
  confidence: number;
  tokensUsed: number;
  tavilyCredits: number;
  
  // Timing
  startedAt: string;
  completedAt?: string;
  
  // Parsed content
  llmResponse?: ParsedLLMResponse;
  tavilySearch?: ParsedTavilySearch;
  tavilyExtract?: ParsedTavilyExtract;
  tavilyCrawl?: ParsedTavilyCrawl;
  tavilyMap?: ParsedTavilyMap;
  
  // Raw data (for debugging/export)
  rawResult?: AgentResultData;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if agent result has structured format
 */
export function isStructuredAgentResultData(result: unknown): result is StructuredAgentResultData {
  return Boolean(
    result &&
    typeof result === 'object' &&
    result !== null &&
    ('llm_response' in result || 'tavily_results' in result || 'key_findings' in result)
  );
}

/**
 * Type guard to check if agent result has legacy format
 */
export function isLegacyAgentResultData(result: unknown): result is LegacyAgentResultData {
  return Boolean(
    result &&
    typeof result === 'object' &&
    result !== null &&
    'llm_response' in result &&
    typeof (result as Record<string, unknown>).llm_response === 'string' &&
    'tavily_data' in result &&
    (result as Record<string, unknown>).tavily_data &&
    typeof (result as Record<string, unknown>).tavily_data === 'object'
  );
}

/**
 * Type guard to check if agent result has proper structure (either format)
 */
export function isAgentResultData(result: unknown): result is AgentResultData {
  return Boolean(isStructuredAgentResultData(result) || isLegacyAgentResultData(result));
}

/**
 * Type guard to check if Tavily data has proper structure
 */
export function isTavilyExecutionResult(data: unknown): data is TavilyExecutionResult {
  if (!data || typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  return Boolean(
    'results' in obj &&
    obj.results &&
    typeof obj.results === 'object' &&
    'credits_used' in obj &&
    typeof obj.credits_used === 'number' &&
    'apis_used' in obj &&
    Array.isArray(obj.apis_used) &&
    'success' in obj &&
    typeof obj.success === 'boolean'
  );
}

/**
 * Get relevance level based on score
 */
export function getRelevanceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/**
 * Format content length for display
 */
export function formatContentLength(length: number): string {
  if (length < 1000) return `${length} chars`;
  if (length < 1000000) return `${(length / 1000).toFixed(1)}K chars`;
  return `${(length / 1000000).toFixed(1)}M chars`;
}

/**
 * Extract key points from LLM response
 */
export function extractKeyPoints(content: string): string[] {
  const keyPoints: string[] = [];
  
  // Look for bullet points
  const bulletMatches = content.match(/^[•\-*]\s+(.+)$/gm);
  if (bulletMatches) {
    keyPoints.push(...bulletMatches.map(match => match.replace(/^[•\-*]\s+/, '')));
  }
  
  // Look for numbered points
  const numberedMatches = content.match(/^\d+\.\s+(.+)$/gm);
  if (numberedMatches) {
    keyPoints.push(...numberedMatches.map(match => match.replace(/^\d+\.\s+/, '')));
  }
  
  // Look for sentences with key indicators
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keyIndicators = ['key', 'important', 'significant', 'critical', 'main', 'primary', 'essential'];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (keyIndicators.some(indicator => lowerSentence.includes(indicator))) {
      keyPoints.push(sentence.trim());
    }
  });
  
  // Return unique key points, limited to 5
  return [...new Set(keyPoints)].slice(0, 5);
}

/**
 * Generate summary from LLM response
 */
export function generateSummary(content: string): string {
  // Take first paragraph or first 200 characters
  const firstParagraph = content.split('\n\n')[0];
  if (firstParagraph.length <= 200) {
    return firstParagraph;
  }
  
  // Truncate to 200 characters at word boundary
  const truncated = content.substring(0, 200);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 150 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}
