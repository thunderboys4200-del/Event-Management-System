export interface User {
  id: string;
  name: string;
  loginId: string;
  role: 'student' | 'staff';
  department: string;
  year?: string;
  mobileNumber?: string;
}

export interface StudentSignInData {
  name: string;
  department: string;
  year: string;
  mobileNumber: string;
}

export interface StudentRegistrationData {
  name: string;
  department: string;
  year: string;
  mobileNumber: string;
  loginId: string;
  password: string;
  confirmPassword: string;
}

export interface EventItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  department: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  registrationDeadline: string;
  posterUrl: string;
  photoUrls: string[];
  videoUrls?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isPast?: boolean;
  registrationCount?: number;
  isRegistered?: boolean;
}

export interface Registration {
  id: string;
  _id?: string;
  student: string | User;
  event: EventItem;
  registeredAt: string;
  createdAt?: string;
}

export interface StudentStats {
  upcomingEventsCount: number;
  myRegistrationsCount: number;
  pastEventsCount: number;
  totalEventsCount: number;
}

export interface StaffStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalRegistrations: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
