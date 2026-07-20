import { apiRequest } from './api';

export interface ComplaintData {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  dept: string;
  priority: string;
  status: string;
  image_url: string | null;
  user_id: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  time: string;
}

export interface OfficerData {
  id: string;
  full_name: string;
  email: string;
}

export const complaintService = {
  async getAll(): Promise<ComplaintData[]> {
    return apiRequest('/complaints');
  },

  async getMy(): Promise<ComplaintData[]> {
    return apiRequest('/complaints/my');
  },

  async updateStatus(complaintId: string, status: string): Promise<any> {
    return apiRequest(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  async listOfficers(): Promise<OfficerData[]> {
    return apiRequest('/officers');
  },

  async assignOfficer(complaintId: string, officerId: string | null): Promise<any> {
    return apiRequest(`/complaints/${complaintId}/assign`, {
      method: 'PATCH',
      body: { officer_id: officerId },
    });
  },

  async update(complaintId: string, payload: Partial<{
    title: string; description: string; location: string;
    latitude: string | null; longitude: string | null; address: string | null;
    department: string; priority: string; image_url: string;
  }>): Promise<ComplaintData> {
    return apiRequest(`/complaints/${complaintId}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async delete(complaintId: string): Promise<any> {
    return apiRequest(`/complaints/${complaintId}`, { method: 'DELETE' });
  },

  async create(payload: {
    title: string;
    description: string;
    location: string;
    latitude: string | null;
    longitude: string | null;
    address: string | null;
    department: string;
    priority: string;
    image_url: string;
  }): Promise<any> {
    return apiRequest('/complaints', { method: 'POST', body: payload });
  },

  async uploadResolution(complaintId: string, payload: { image_url: string, notes?: string, status_update?: string }): Promise<any> {
    return apiRequest(`/complaints/${complaintId}/resolution`, {
      method: 'POST',
      body: payload,
    });
  },

  async verifyResolution(complaintId: string, payload: { is_valid: boolean, comments?: string }): Promise<any> {
    return apiRequest(`/complaints/${complaintId}/verify`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async getResolution(complaintId: string): Promise<any> {
    return apiRequest(`/complaints/${complaintId}/resolution`, {
      method: 'GET',
    });
  },
};
