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

export type AttendanceStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';
export type RegistrationStatus = 'confirmed' | 'cancelled';

export interface Registration {
  id: string;
  _id?: string;
  student: string | User;
  event: EventItem;
  registeredAt: string;
  createdAt?: string;
  // QR check-in & attendance (absent on very old cached responses, so all optional)
  registrationId?: string;
  status?: RegistrationStatus;
  attendanceStatus?: AttendanceStatus;
  checkedInAt?: string;
}

export interface EventPassData {
  id: string;
  registrationId: string;
  qrToken: string;
  status: RegistrationStatus;
  attendanceStatus: AttendanceStatus;
  checkedInAt?: string;
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    posterUrl?: string;
    status?: 'active' | 'cancelled';
  };
  student: {
    name: string;
    studentId: string;
    department: string;
    branch: string;
    year?: string;
    section?: string;
  };
}

export interface AttendanceRow {
  id: string;
  registrationId: string;
  status: RegistrationStatus;
  attendanceStatus: AttendanceStatus;
  registeredAt?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  student: {
    id: string;
    name: string;
    loginId: string;
    department: string;
    branch: string;
    year?: string;
    section?: string;
  };
}

export interface AttendanceStats {
  registered: number;
  checkedIn: number;
  notCheckedIn: number;
  percentage: number;
  recentCheckIns: Array<{
    registrationId: string;
    name: string;
    department: string;
    branch: string;
    checkedInAt: string;
  }>;
}

export interface EventAttendance {
  event: { id: string; title: string; date: string; venue: string; status: 'active' | 'cancelled' };
  stats: AttendanceStats;
  attendees: AttendanceRow[];
}

export interface ScanResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    student?: { name: string; studentId: string; department: string; branch: string; year?: string; section?: string };
    event?: { id: string; title: string };
    registrationId?: string;
    attendanceStatus?: AttendanceStatus;
    checkedInAt?: string;
    checkedInBy?: string;
    otherEventTitle?: string;
  };
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
