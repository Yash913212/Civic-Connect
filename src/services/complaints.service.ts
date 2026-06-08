import { apiClient } from '@/auth/apiClient';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'SUBMITTED' | 'ANALYZED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  department?: string;
  citizen_id: string;
  assigned_officer_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ComplaintHistory {
  id: string;
  complaint_id: string;
  old_status?: string;
  new_status: string;
  changed_by: string;
  created_at: string;
}

export interface ComplaintWithHistory extends Complaint {
  history: ComplaintHistory[];
}

export const ComplaintService = {
  // Citizen
  create: async (data: { title: string; description: string; location: string }) => {
    const res = await apiClient.post<Complaint>('/complaints', data);
    return res.data;
  },
  getMyComplaints: async () => {
    const res = await apiClient.get<Complaint[]>('/complaints/my');
    return res.data;
  },
  
  // Officer
  getOfficerComplaints: async () => {
    const res = await apiClient.get<Complaint[]>('/officer/complaints');
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<Complaint>(`/officer/complaints/${id}/status`, { status });
    return res.data;
  },
  
  // Admin
  getAdminComplaints: async (skip = 0, limit = 100) => {
    const res = await apiClient.get<Complaint[]>('/admin/complaints', { params: { skip, limit } });
    return res.data;
  },
  assignOfficer: async (complaint_id: string, officer_id: string) => {
    const res = await apiClient.post<Complaint>('/admin/assign', { complaint_id, officer_id });
    return res.data;
  },
  
  // Shared
  getById: async (id: string) => {
    const res = await apiClient.get<ComplaintWithHistory>(`/complaints/${id}`);
    return res.data;
  },
  search: async (params: { status?: string; priority?: string; department?: string }) => {
    const res = await apiClient.get<Complaint[]>('/complaints/search', { params });
    return res.data;
  }
};
