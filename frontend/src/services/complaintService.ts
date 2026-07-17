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
  ai_summary: string | null;
  ai_request_letter: string | null;
  user_id: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  time: string;
}

export interface OfficerData {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

export interface ComplaintValidation {
  title: string;
  description: string;
  location: string;
}

const validateComplaint = (complaint: ComplaintValidation): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!complaint.title || complaint.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (complaint.title && complaint.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  if (!complaint.description || complaint.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (complaint.description && complaint.description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  if (!complaint.location || complaint.location.trim().length < 5) {
    errors.push('Location is required');
  }
  
  return { valid: errors.length === 0, errors };
};

export const complaintService = {
  async getAll(): Promise<ComplaintData[]> {
    return apiRequest('/complaints');
  },

  async getMy(): Promise<ComplaintData[]> {
    return apiRequest('/complaints/my');
  },

  async updateStatus(complaintId: string, status: string): Promise<any> {
    const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
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
    ai_summary?: string;
    ai_request_letter?: string;
  }): Promise<any> {
    const validation = validateComplaint(payload);
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }
    return apiRequest('/complaints', { method: 'POST', body: payload });
  },
};
