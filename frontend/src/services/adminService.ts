import { apiRequest } from './api';

export interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface DepartmentData {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string | null;
}

export const adminService = {
  async listUsers(): Promise<UserData[]> {
    return apiRequest('/users');
  },

  async updateRole(userId: string, role: string): Promise<any> {
    return apiRequest(`/users/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    });
  },

  async toggleActive(userId: string): Promise<any> {
    return apiRequest(`/users/${userId}/toggle-active`, { method: 'PATCH' });
  },

  async listDepartments(): Promise<DepartmentData[]> {
    return apiRequest('/departments');
  },

  async createDepartment(name: string, description: string): Promise<any> {
    return apiRequest('/departments', {
      method: 'POST',
      body: { name, description },
    });
  },

  async updateDepartment(id: string, data: Partial<DepartmentData>): Promise<any> {
    return apiRequest(`/departments/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  async deleteDepartment(id: string): Promise<any> {
    return apiRequest(`/departments/${id}`, { method: 'DELETE' });
  },

  async updateUserDepartment(userId: string, department: string | null): Promise<any> {
    return apiRequest(`/users/${userId}/department`, {
      method: 'PATCH',
      body: { department },
    });
  },
};
