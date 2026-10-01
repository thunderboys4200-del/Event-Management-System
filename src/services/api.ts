import axios from 'axios';
import { ApiResponse, EventItem, Registration, StudentStats, StaffStats, User, StudentSignInData, StudentRegistrationData } from '../types';

const api = axios.create({
  baseURL: '', // Uses same host proxying to Express backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cep_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto-clear invalid token on auth failures, except when trying to login
      const isLoginEndpoint = error.config?.url?.includes('/api/auth/login') || error.config?.url?.includes('/api/auth/student-signin');
      if (!isLoginEndpoint) {
        localStorage.removeItem('cep_token');
        localStorage.removeItem('cep_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async login(loginId: string, password: string, role?: 'student' | 'staff'): Promise<{ token: string; user: User }> {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/api/auth/login', {
      loginId,
      password,
      role,
    });
    return res.data.data!;
  },

  async studentSignIn(data: StudentSignInData): Promise<{ token: string; user: User }> {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/api/auth/student-signin', data);
    return res.data.data!;
  },

  async registerStudent(data: StudentRegistrationData): Promise<{ id: string; name: string; loginId: string; department: string }> {
    const res = await api.post<ApiResponse<{ id: string; name: string; loginId: string; department: string }>>('/api/auth/student-register', data);
    return res.data.data!;
  },

  async getProfile(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/api/auth/me');
    return res.data.data!;
  }
};

export const eventsApi = {
  async getEvents(params?: { type?: 'upcoming' | 'past' | 'all'; department?: string; category?: string; search?: string }): Promise<EventItem[]> {
    const res = await api.get<ApiResponse<EventItem[]>>('/api/events', { params });
    return res.data.data || [];
  },

  async getEventById(id: string): Promise<EventItem> {
    const res = await api.get<ApiResponse<EventItem>>(`/api/events/${id}`);
    return res.data.data!;
  },

  async createEvent(formData: FormData): Promise<EventItem> {
    const res = await api.post<ApiResponse<EventItem>>('/api/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data!;
  },

  async updateEvent(id: string, formData: FormData): Promise<EventItem> {
    const res = await api.put<ApiResponse<EventItem>>(`/api/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data!;
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete<ApiResponse>(`/api/events/${id}`);
  },

  async getEventRegistrations(id: string): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>(`/api/events/${id}/registrations`);
    return res.data.data || [];
  },

  async downloadRegistrations(id: string): Promise<Blob> {
    const res = await api.get(`/api/events/${id}/registrations/export`, { responseType: 'blob' });
    return res.data;
  },
};

export const registrationsApi = {
  async register(eventId: string): Promise<Registration> {
    const res = await api.post<ApiResponse<Registration>>('/api/registrations', { eventId });
    return res.data.data!;
  },

  async getMyRegistrations(): Promise<Registration[]> {
    const res = await api.get<ApiResponse<Registration[]>>('/api/registrations/my');
    return res.data.data || [];
  },

};

export const statsApi = {
  async getStats(): Promise<StudentStats | StaffStats> {
    const res = await api.get<ApiResponse<any>>('/api/stats');
    return res.data.data;
  },
};

export default api;
