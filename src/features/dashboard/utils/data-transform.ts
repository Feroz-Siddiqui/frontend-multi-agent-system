/**
 * Data Transformation Utilities
 * 
 * Utilities for transforming backend snake_case data to frontend camelCase
 */

/**
 * Convert snake_case string to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform object keys from snake_case to camelCase
 */
function transformKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeys(value);
    }
    return transformed;
  }

  return obj;
}

/**
 * Transform dashboard data from backend format to frontend format
 */
export function transformDashboardData(backendData: unknown) {
  console.log('🔄 Transforming dashboard data:', backendData);
  const transformed = transformKeys(backendData);
  console.log('✅ Transformed dashboard data:', transformed);
  return transformed;
}

/**
 * Transform system overview data
 */
export function transformSystemOverview(backendData: unknown) {
  return transformKeys(backendData);
}

/**
 * Transform activity feed data
 */
export function transformActivityFeed(backendData: unknown) {
  if (!backendData || !Array.isArray(backendData)) {
    return [];
  }
  return backendData.map(transformKeys);
}

/**
 * Transform performance metrics data
 */
export function transformPerformanceMetrics(backendData: unknown) {
  return transformKeys(backendData);
}

/**
 * Transform system health data
 */
export function transformSystemHealth(backendData: unknown) {
  return transformKeys(backendData);
}

/**
 * Transform live executions data
 */
export function transformLiveExecutions(backendData: unknown) {
  if (!backendData || !Array.isArray(backendData)) {
    return [];
  }
  return backendData.map(transformKeys);
}

/**
 * Transform template hub data
 */
export function transformTemplateHub(backendData: unknown) {
  if (!backendData || !Array.isArray(backendData)) {
    return [];
  }
  return backendData.map(transformKeys);
}
