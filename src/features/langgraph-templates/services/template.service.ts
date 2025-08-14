/**
 * Template Service
 * 
 * API service for template CRUD operations
 */

import { ApiClient } from '../../../services/api/ApiClient';
import type { Template } from '../types';

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateFilters {
  category?: string;
  search?: string;
  author?: string;
  tags?: string[];
}

export interface TemplateListParams extends TemplateFilters {
  page?: number;
  limit?: number;
  sort?: 'name' | 'created_at' | 'updated_at' | 'usage_count';
  order?: 'asc' | 'desc';
  is_public?: boolean;
}

export interface TemplateStats {
  usage_count: number;
  success_rate: number;
  average_duration: number;
  average_cost: number;
  last_used: string | null;
}

export class TemplateService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Create a new template
   */
  async createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    try {
      // Backend returns {template_id, message} format
      const response = await this.apiClient.post<{template_id: string; message: string}>('/api/templates', template);
      
      // Fetch the created template to return full Template object
      const createdTemplate = await this.getTemplate(response.template_id);
      if (!createdTemplate) {
        throw new Error('Failed to retrieve created template');
      }
      
      return createdTemplate;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw new Error('Failed to create template. Please try again.');
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    try {
      const response = await this.apiClient.get<Template>(`/api/templates/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to get template:', error);
      throw new Error('Failed to load template. Please try again.');
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
    try {
      // Backend returns {template_id, message} format for updates
      const response = await this.apiClient.put<{template_id: string; message: string}>(`/api/templates/${id}`, template);
      
      // Fetch the updated template to return full Template object
      const updatedTemplate = await this.getTemplate(response.template_id);
      if (!updatedTemplate) {
        throw new Error('Failed to retrieve updated template');
      }
      
      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw new Error('Failed to update template. Please try again.');
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/api/templates/${id}`);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw new Error('Failed to delete template. Please try again.');
    }
  }

  /**
   * List templates with filtering
   */
  async listTemplates(params: { category?: string; is_public?: boolean } = {}): Promise<Template[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.category) queryParams.append('category', params.category);
      if (params.is_public !== undefined) queryParams.append('is_public', params.is_public.toString());

      const url = `/api/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.apiClient.get<TemplateListResponse>(url);
      
      // Backend returns paginated response, extract templates array
      return response.templates || [];
    } catch (error) {
      console.error('Failed to list templates:', error);
      throw new Error('Failed to load templates. Please try again.');
    }
  }

  /**
   * List templates with pagination
   */
  async listTemplatesPaginated(params: TemplateListParams = {}): Promise<TemplateListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.category) queryParams.append('category', params.category);
      if (params.is_public !== undefined) queryParams.append('is_public', params.is_public.toString());

      const url = `/api/templates?${queryParams.toString()}`;
      const response = await this.apiClient.get<TemplateListResponse>(url);
      return response;
    } catch (error) {
      console.error('Failed to list templates:', error);
      throw new Error('Failed to load templates. Please try again.');
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string, limit: number = 20): Promise<Template[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      queryParams.append('limit', limit.toString());

      const url = `/api/templates/search?${queryParams.toString()}`;
      const response = await this.apiClient.get<Template[]>(url);
      return response;
    } catch (error) {
      console.error('Failed to search templates:', error);
      throw new Error('Failed to search templates. Please try again.');
    }
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await this.apiClient.get<{ categories: string[] }>('/templates/categories');
      return response.categories;
    } catch (error) {
      console.error('Failed to get categories:', error);
      return ['market_research', 'cybersecurity', 'financial_analysis', 'supply_chain', 'custom'];
    }
  }

  /**
   * Get template tags
   */
  async getTags(): Promise<string[]> {
    try {
      const response = await this.apiClient.get<{ tags: string[] }>('/templates/tags');
      return response.tags;
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  }

  /**
   * Validate template
   */
  async validateTemplate(template: Omit<Template, 'id'>): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await this.apiClient.post<{ isValid: boolean; errors: string[] }>(
        '/templates/validate', 
        template
      );
      return response;
    } catch (error) {
      console.error('Failed to validate template:', error);
      // Fallback to client-side validation
      return { isValid: false, errors: ['Validation service unavailable'] };
    }
  }

  /**
   * Clone template
   */
  async cloneTemplate(id: string, name?: string): Promise<Template> {
    try {
      const response = await this.apiClient.post<Template>(`/templates/${id}/clone`, {
        name: name || `Copy of ${id}`,
      });
      return response;
    } catch (error) {
      console.error('Failed to clone template:', error);
      throw new Error('Failed to clone template. Please try again.');
    }
  }

  /**
   * Export template
   */
  async exportTemplate(id: string): Promise<Blob> {
    try {
      const response = await this.apiClient.get(`/templates/${id}/export`, {
        responseType: 'blob',
      });
      return response as Blob;
    } catch (error) {
      console.error('Failed to export template:', error);
      throw new Error('Failed to export template. Please try again.');
    }
  }

  /**
   * Import template
   */
  async importTemplate(file: File): Promise<Template> {
    try {
      const formData = new FormData();
      formData.append('template', file);

      const response = await this.apiClient.post<Template>('/templates/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to import template:', error);
      throw new Error('Failed to import template. Please check the file format and try again.');
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(id: string): Promise<TemplateStats> {
    try {
      const response = await this.apiClient.get<TemplateStats>(`/api/templates/${id}/stats`);
      return response;
    } catch (error) {
      console.error('Failed to get template stats:', error);
      return {
        usage_count: 0,
        success_rate: 0,
        average_duration: 0,
        average_cost: 0,
        last_used: null,
      };
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService();
export default templateService;
