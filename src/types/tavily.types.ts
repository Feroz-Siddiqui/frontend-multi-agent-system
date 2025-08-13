/**
 * Tavily API Types
 * 
 * TypeScript types for Tavily API integration aligned with backend Python models
 * Used in LangGraph execution workflow for external API calls
 */

// Tavily API Types - matches src/models/tavily/responses.py:14
export type TavilyAPIType = 
  | 'search'
  | 'extract'
  | 'crawl'
  | 'map';

// Tavily Search Depth
export type TavilySearchDepth = 'basic' | 'advanced';

// Tavily Extract Depth
export type TavilyExtractDepth = 'basic' | 'advanced';

// Tavily Content Format
export type TavilyContentFormat = 'markdown' | 'text';

// Tavily Time Range
export type TavilyTimeRange = 'day' | 'week' | 'month' | 'year';

// Tavily Configuration - matches backend structure from src/models/template.py:151
export interface TavilyConfig {
  // API Selection - Individual toggles for each API (matches backend)
  search_api: boolean;
  extract_api: boolean;
  crawl_api: boolean;
  map_api: boolean;
  
  // Search API Configuration
  search_depth: TavilySearchDepth;
  max_results: number;
  time_range?: TavilyTimeRange;
  include_domains?: string[];
  exclude_domains?: string[];
  country?: string;
  include_answer: boolean;
  include_images: boolean;
  include_raw_content: boolean;
  
  // Extract API Configuration
  extract_depth: TavilyExtractDepth;
  format: TavilyContentFormat;
  
  // Crawl API Configuration (BETA)
  crawl_instructions?: string;
  max_crawl_depth: number;
  crawl_limit: number;
  
  // Map API Configuration (BETA)
  map_instructions?: string;
  max_map_depth: number;
  
  // Cost Management
  estimated_credits: number;
  max_credits_per_agent: number;
  
  // Performance Settings
  timeout_seconds: number;
  retry_attempts: number;
  
  // Fallback Configuration
  fallback_enabled: boolean;
  continue_without_tavily: boolean;
}

// Tavily Search Result - matches src/models/tavily/responses.py:35
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
  favicon?: string;
}

// Tavily Search Response - matches src/models/tavily/responses.py:50
export interface TavilySearchResponse {
  query: string;
  answer?: string;
  images: string[];
  results: TavilySearchResult[];
  response_time: number;
}

// Tavily Extract Result - matches src/models/tavily/responses.py:74
export interface TavilyExtractResult {
  url: string;
  raw_content: string;
  images: string[];
  favicon?: string;
  title?: string;
}

// Tavily Extract Response - matches src/models/tavily/responses.py:88
export interface TavilyExtractResponse {
  results: TavilyExtractResult[];
  failed_results: Record<string, unknown>[];
  response_time: number;
}

// Tavily Crawl Result - matches src/models/tavily/responses.py:109
export interface TavilyCrawlResult {
  url: string;
  raw_content: string;
  images: string[];
  favicon?: string;
  title?: string;
  depth?: number;
  parent_url?: string;
}

// Tavily Crawl Response - matches src/models/tavily/responses.py:124
export interface TavilyCrawlResponse {
  base_url: string;
  results: TavilyCrawlResult[];
  response_time: number;
  total_pages_crawled?: number;
  max_depth_reached?: number;
}

// Tavily Map Response - matches src/models/tavily/responses.py:147
export interface TavilyMapResponse {
  base_url: string;
  results: string[];
  images: string[];
  response_time: number;
  total_urls_found?: number;
  depth_levels?: Record<string, number>;
}

// Tavily Unified Response - matches src/models/tavily/responses.py:214
export interface TavilyUnifiedResponse {
  api_type: TavilyAPIType;
  success: boolean;
  search_response?: TavilySearchResponse;
  extract_response?: TavilyExtractResponse;
  crawl_response?: TavilyCrawlResponse;
  map_response?: TavilyMapResponse;
  credits_used: number;
  response_time: number;
  error_message?: string;
  query?: string;
  timestamp: string;
}

// Default Tavily Configuration - aligned with backend defaults
export const DEFAULT_TAVILY_CONFIG: TavilyConfig = {
  // API Selection - Conservative defaults
  search_api: false,
  extract_api: false,
  crawl_api: false,
  map_api: false,
  
  // Search API Configuration
  search_depth: 'basic',
  max_results: 3,
  time_range: undefined,
  include_domains: [],
  exclude_domains: [],
  country: undefined,
  include_answer: true,
  include_images: true,
  include_raw_content: false,
  
  // Extract API Configuration
  extract_depth: 'basic',
  format: 'markdown',
  
  // Crawl API Configuration (BETA)
  crawl_instructions: undefined,
  max_crawl_depth: 3,
  crawl_limit: 50,
  
  // Map API Configuration (BETA)
  map_instructions: undefined,
  max_map_depth: 2,
  
  // Cost Management
  estimated_credits: 0,
  max_credits_per_agent: 10,
  
  // Performance Settings
  timeout_seconds: 30,
  retry_attempts: 2,
  
  // Fallback Configuration
  fallback_enabled: true,
  continue_without_tavily: true,
};
