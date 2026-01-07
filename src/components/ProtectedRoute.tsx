import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../lib/supabase';
import { isAdminEmail } from '../config/admins';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si c'est un admin (pas de profil)
  const isAdmin = isAdminEmail(user.email);

  // Si c'est un admin, autoriser l'accès aux routes admin
  if (isAdmin && allowedRoles?.includes('admin' as UserRole)) {
    return <>{children}</>;
  }

  // Pour les non-admins, vérifier le profil
  if (allowedRoles && profile) {
    const profileRole = profile.role as UserRole;
    // Vérifier si le rôle correspond (incluant les variantes de partner)
    const hasAccess = allowedRoles.some(role => {
      if (role === 'partner_tourism' || role === 'partner_car' || role === 'partner_realestate') {
        return profileRole === 'partner_tourism' || profileRole === 'partner_car' || profileRole === 'partner_realestate';
      }
      return role === profileRole;
    });
    
    if (!hasAccess) {
      // Rediriger vers le dashboard approprié selon le rôle
      if (isAdmin) {
        return <Navigate to="/dashboard/admin" replace />;
      } else if (profileRole === 'partner_tourism' || profileRole === 'partner_car' || profileRole === 'partner_realestate') {
        return <Navigate to="/dashboard/partner" replace />;
      } else {
        return <Navigate to="/dashboard/client" replace />;
      }
    }
  }

  // Si c'est un admin sans restriction de rôle, autoriser
  if (isAdmin && !allowedRoles) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
