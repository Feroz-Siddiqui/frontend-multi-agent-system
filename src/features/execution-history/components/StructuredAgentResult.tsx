/**
 * StructuredAgentResult Component
 * 
 * Displays structured agent results with beautiful formatting
 * Uses the structured data from the backend instead of raw JSON
 */

import { 
  Bot,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  FileText,
  Globe,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Clock,
  DollarSign,
  Zap,
  Target
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { EnhancedImageGallery } from '../../../components/ui/image-gallery';

import type { LLMResponse, TavilySource } from '../types/execution-result.types';
import type { AgentResult } from '../types';

interface StructuredAgentResultProps {
  agentResult: AgentResult;
  hideHeader?: boolean; // New prop to hide the duplicate header
}

interface TavilySearchResults {
  query: string;
  answer?: string;
  sources: TavilySource[];
  total_results: number;
  response_time: number;
  has_answer: boolean;
}

interface TavilyExtractResults {
  sources: TavilySource[];
  total_extractions: number;
  failed_extractions: number;
  response_time: number;
  total_content_length: number;
}

interface TavilyCrawlResults {
  base_url: string;
  sources: TavilySource[];
  total_pages: number;
  max_depth_reached: number;
  response_time: number;
}

interface TavilyMapResults {
  base_url: string;
  discovered_urls: string[];
  total_urls: number;
  response_time: number;
  url_categories: Record<string, number>;
}

interface TavilyResults {
  search?: TavilySearchResults;
  extract?: TavilyExtractResults;
  crawl?: TavilyCrawlResults;
  map?: TavilyMapResults;
  total_sources: number;
  total_credits_used: number;
  apis_used: string[];
  total_response_time: number;
  successful_apis: number;
  failed_apis: number;
  has_results: boolean;
}

function LLMResponseDisplay({ llmResponse }: { llmResponse: LLMResponse }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="w-4 h-4 text-blue-600" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{llmResponse.summary}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              Confidence: {Math.round(llmResponse.confidence * 100)}%
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {llmResponse.word_count} words
            </div>
            {llmResponse.contains_recommendations && (
              <Badge variant="secondary" className="text-xs">
                <Lightbulb className="w-3 h-3 mr-1" />
                Contains Recommendations
              </Badge>
            )}
            {llmResponse.contains_data && (
              <Badge variant="secondary" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Contains Data
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Points */}
      {llmResponse.key_points.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {llmResponse.key_points.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Full Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-gray-600" />
            Full Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {llmResponse.content}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TavilySourceCard({ source }: { source: TavilySource }) {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'search': return <Search className="w-4 h-4 text-blue-600" />;
      case 'extract': return <FileText className="w-4 h-4 text-green-600" />;
      case 'crawl': return <Globe className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRelevanceBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="default" className="text-xs">High Relevance</Badge>;
    if (score >= 0.6) return <Badge variant="secondary" className="text-xs">Medium Relevance</Badge>;
    return <Badge variant="outline" className="text-xs">Low Relevance</Badge>;
  };

  const formatContentLength = (length: number) => {
    if (length < 1000) return `${length} chars`;
    if (length < 1000000) return `${(length / 1000).toFixed(1)}K chars`;
    return `${(length / 1000000).toFixed(1)}M chars`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getSourceIcon(source.source_type || 'search')}
            {/* Show favicon if available */}
            {source.favicon && (
              <img 
                src={source.favicon} 
                alt="Favicon" 
                className="w-3 h-3 ml-1 rounded-sm"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight">
              {source.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getRelevanceBadge(source.relevance_score)}
              <Badge variant="outline" className="text-xs capitalize">
                {source.source_type}
              </Badge>
              {/* Show depth for crawl results */}
              {source.depth !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  Depth {source.depth}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Content Preview */}
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Content Preview</div>
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
            {source.content_preview}
          </p>
        </div>

        {/* Raw Content Preview (if available and different from content_preview) */}
        {source.raw_content && source.raw_content !== source.content_preview && (
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Raw Content Preview</div>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed font-mono text-xs">
              {source.raw_content.substring(0, 200)}...
            </p>
          </div>
        )}

        {/* Images (if available) */}
        {source.images && source.images.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <EnhancedImageGallery
              images={source.images}
              title={`Images from ${source.title || 'Source'}`}
              maxPreviewImages={3}
              className="mt-2"
            />
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Length: {formatContentLength(source.content_length)}</div>
          <div>Relevance: {Math.round(source.relevance_score * 100)}%</div>
          {source.parent_url && (
            <div>Parent: <span className="truncate">{source.parent_url}</span></div>
          )}
        </div>

        {/* URL */}
        <div className="pt-2 border-t">
          {source.url ? (
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{source.url}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">URL not available</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TavilyResultsDisplay({ tavilyResults }: { tavilyResults: TavilyResults }) {
  if (!tavilyResults.has_results) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No Tavily results available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4 text-blue-600" />
            Research Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tavilyResults.total_sources}</div>
              <div className="text-gray-600">Total Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tavilyResults.successful_apis}</div>
              <div className="text-gray-600">APIs Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{tavilyResults.total_credits_used}</div>
              <div className="text-gray-600">Credits Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{tavilyResults.total_response_time.toFixed(1)}s</div>
              <div className="text-gray-600">Response Time</div>
            </div>
          </div>
          
          {tavilyResults.apis_used.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">APIs Used:</div>
              <div className="flex gap-2">
                {tavilyResults.apis_used.map(api => (
                  <Badge key={api} variant="secondary" className="text-xs capitalize">
                    {api}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tavily Results Tabs */}
      <Tabs defaultValue={tavilyResults.search ? 'search' : tavilyResults.extract ? 'extract' : 'crawl'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" disabled={!tavilyResults.search}>
            <Search className="w-4 h-4 mr-2" />
            Search ({tavilyResults.search?.sources.length || 0})
          </TabsTrigger>
          <TabsTrigger value="extract" disabled={!tavilyResults.extract}>
            <FileText className="w-4 h-4 mr-2" />
            Extract ({tavilyResults.extract?.sources.length || 0})
          </TabsTrigger>
          <TabsTrigger value="crawl" disabled={!tavilyResults.crawl}>
            <Globe className="w-4 h-4 mr-2" />
            Crawl ({tavilyResults.crawl?.sources.length || 0})
          </TabsTrigger>
          <TabsTrigger value="map" disabled={!tavilyResults.map}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Map ({tavilyResults.map?.discovered_urls.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Search Results */}
        {tavilyResults.search && (
          <TabsContent value="search" className="space-y-4">
            {/* Search Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search Summary</CardTitle>
                <CardDescription>Query: "{tavilyResults.search.query}"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{tavilyResults.search.total_results}</div>
                    <div className="text-gray-600">Total Results</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{tavilyResults.search.sources.length}</div>
                    <div className="text-gray-600">Sources Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{tavilyResults.search.response_time.toFixed(1)}s</div>
                    <div className="text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{tavilyResults.search.has_answer ? 'Yes' : 'No'}</div>
                    <div className="text-gray-600">Direct Answer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direct Answer */}
            {tavilyResults.search.has_answer && tavilyResults.search.answer && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base text-blue-800">Direct Answer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-700">{tavilyResults.search.answer}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Search Sources */}
            {tavilyResults.search.sources && tavilyResults.search.sources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tavilyResults.search.sources.map((source, index) => (
                  <TavilySourceCard key={index} source={source} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No search results found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    The search query "{tavilyResults.search.query}" returned no results
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Extract Results */}
        {tavilyResults.extract && (
          <TabsContent value="extract" className="space-y-4">
            {/* Extract Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extract Summary</CardTitle>
                <CardDescription>Content extraction results and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{tavilyResults.extract.total_extractions}</div>
                    <div className="text-gray-600">Total Extractions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{tavilyResults.extract.failed_extractions}</div>
                    <div className="text-gray-600">Failed Extractions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{tavilyResults.extract.response_time.toFixed(1)}s</div>
                    <div className="text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{(tavilyResults.extract.total_content_length / 1000).toFixed(1)}K</div>
                    <div className="text-gray-600">Total Content</div>
                  </div>
                </div>
                
                {/* Success Rate */}
                {tavilyResults.extract.total_extractions > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Success Rate: {Math.round(((tavilyResults.extract.total_extractions - tavilyResults.extract.failed_extractions) / tavilyResults.extract.total_extractions) * 100)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${((tavilyResults.extract.total_extractions - tavilyResults.extract.failed_extractions) / tavilyResults.extract.total_extractions) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Extract Sources */}
            {tavilyResults.extract.sources && tavilyResults.extract.sources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tavilyResults.extract.sources.map((source, index) => (
                  <TavilySourceCard key={index} source={source} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No extracted content available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {tavilyResults.extract.failed_extractions > 0 
                      ? `${tavilyResults.extract.failed_extractions} extraction(s) failed`
                      : 'No content was extracted from the provided URLs'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Crawl Results */}
        {tavilyResults.crawl && (
          <TabsContent value="crawl" className="space-y-4">
            {/* Crawl Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crawl Summary</CardTitle>
                <CardDescription>Base URL: {tavilyResults.crawl.base_url}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{tavilyResults.crawl.total_pages}</div>
                    <div className="text-gray-600">Pages Crawled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{tavilyResults.crawl.max_depth_reached}</div>
                    <div className="text-gray-600">Max Depth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{tavilyResults.crawl.response_time.toFixed(1)}s</div>
                    <div className="text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{tavilyResults.crawl.sources.length}</div>
                    <div className="text-gray-600">Sources Found</div>
                  </div>
                </div>
                
                {/* Crawl Efficiency */}
                {tavilyResults.crawl.total_pages > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Crawl Efficiency: {Math.round((tavilyResults.crawl.sources.length / tavilyResults.crawl.total_pages) * 100)}% pages yielded content
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(tavilyResults.crawl.sources.length / tavilyResults.crawl.total_pages) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Crawl Sources */}
            {tavilyResults.crawl.sources && tavilyResults.crawl.sources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tavilyResults.crawl.sources.map((source, index) => (
                  <TavilySourceCard key={index} source={source} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No crawled content available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {tavilyResults.crawl.total_pages > 0 
                      ? `Crawled ${tavilyResults.crawl.total_pages} pages but found no extractable content`
                      : `No pages were crawled from ${tavilyResults.crawl.base_url}`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Map Results */}
        {tavilyResults.map && (
          <TabsContent value="map" className="space-y-4">
            {/* Map Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Site Map Summary</CardTitle>
                <CardDescription>Base URL: {tavilyResults.map.base_url}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{tavilyResults.map.total_urls}</div>
                    <div className="text-gray-600">Total URLs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{tavilyResults.map.url_categories.page || 0}</div>
                    <div className="text-gray-600">Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{tavilyResults.map.url_categories.resource || 0}</div>
                    <div className="text-gray-600">Resources</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{tavilyResults.map.url_categories.external || 0}</div>
                    <div className="text-gray-600">External</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{tavilyResults.map.response_time.toFixed(1)}s</div>
                    <div className="text-gray-600">Response Time</div>
                  </div>
                </div>
                
                {/* URL Distribution */}
                {tavilyResults.map.total_urls > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-3">URL Distribution:</div>
                    <div className="space-y-2">
                      {Object.entries(tavilyResults.map?.url_categories || {}).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / (tavilyResults.map?.total_urls || 1)) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Discovered URLs */}
            {tavilyResults.map.discovered_urls && tavilyResults.map.discovered_urls.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Discovered URLs</CardTitle>
                  <CardDescription>All URLs found during site mapping</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full border rounded p-4">
                    <div className="space-y-2">
                      {tavilyResults.map.discovered_urls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors truncate"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No URLs discovered</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Site mapping of {tavilyResults.map.base_url} found no discoverable URLs
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export function StructuredAgentResult({ agentResult, hideHeader = false }: StructuredAgentResultProps) {
  const config = agentResult.success 
    ? { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' }
    : { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
  
  const Icon = config.icon;

  // Extract structured data from the result
  const result = agentResult.result || {};
  const llmResponse = result.llm_response as LLMResponse | null;
  const tavilyResults = result.tavily_results as TavilyResults | null;
  const keyFindings = result.key_findings as string[] || [];
  const recommendations = result.recommendations as string[] || [];
  const dataPoints = result.data_points as string[] || [];
  const allSources = result.all_sources as TavilySource[] || [];

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(3)}`;
  };

  return (
    <div className="space-y-6">
      {/* Agent Header - Only show if not hidden */}
      {!hideHeader && (
        <Card className={`border ${config.border}`}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{agentResult.agent_name}</CardTitle>
                <CardDescription className={`font-medium ${config.color}`}>
                  {agentResult.success ? 'Completed Successfully' : 'Failed'}
                </CardDescription>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={agentResult.success ? "default" : "destructive"}>
                  {agentResult.success ? 'Success' : 'Failed'}
                </Badge>
                <div className="text-sm text-gray-500">
                  {formatDuration(agentResult.duration_seconds)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-600">Duration</div>
                  <div className="font-medium">{formatDuration(agentResult.duration_seconds)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-600">Cost</div>
                  <div className="font-medium">{formatCost(agentResult.cost)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-600">Confidence</div>
                  <div className="font-medium">{Math.round(agentResult.confidence_score * 100)}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-600">Tokens</div>
                  <div className="font-medium">{agentResult.tokens_used.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {!agentResult.success && agentResult.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-800">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{agentResult.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Data Points */}
      {dataPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-green-600" />
              Key Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dataPoints.map((dataPoint, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <BarChart3 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{dataPoint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="llm" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Response
          </TabsTrigger>
          <TabsTrigger value="tavily" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Research Data ({allSources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="llm">
          {llmResponse ? (
            <LLMResponseDisplay llmResponse={llmResponse} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No AI response available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tavily">
          {tavilyResults ? (
            <TavilyResultsDisplay tavilyResults={tavilyResults} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No research data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StructuredAgentResult;
