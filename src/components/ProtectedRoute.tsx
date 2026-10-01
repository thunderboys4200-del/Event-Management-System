import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'student' | 'staff';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with appropriate role query param
    return <Navigate to={`/login?role=${allowedRole || 'student'}`} state={{ from: location }} replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // If student tries to visit staff page or vice versa
    return <Navigate to={user?.role === 'staff' ? '/staff/dashboard' : '/student/dashboard'} replace />;
  }

  return <>{children}</>;
};
