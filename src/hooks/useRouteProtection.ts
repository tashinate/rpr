import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { validateSessionWithDatabase, forceLogout } from '@/utils/services/sessionCleanup';

/**
 * Hook to validate session on route navigation
 * Provides URL access middleware functionality
 */
export const useRouteProtection = () => {
  const location = useLocation();

  useEffect(() => {
    const validateRouteAccess = () => {
      const licenseSessionToken = localStorage.getItem('license_session_token');
      const isAuthenticated = sessionStorage.getItem('redirect_system_authenticated');
      const passwordAuth = sessionStorage.getItem('password_authenticated');

      // Protect Nexus route - require authentication (immediate check)
      if (location.pathname === '/nexus') {
        if (!isAuthenticated && !passwordAuth) {
          window.location.href = '/greyboi';
          return;
        }
      }

      // Skip validation if not authenticated or using password auth
      if (!isAuthenticated || passwordAuth) {
        return;
      }

      // Defer expensive validation to not block navigation
      if (licenseSessionToken) {
        setTimeout(async () => {
          try {
            const result = await validateSessionWithDatabase(licenseSessionToken);
            
            if (!result.valid) {
              console.log('Route access denied - invalid session:', result.error);
              forceLogout(`Route access denied: ${result.error}`);
            }
          } catch (error) {
            console.error('Route validation error:', error);
            forceLogout('Route validation failed');
          }
        }, 0);
      }
    };

    // Immediate validation without async blocking
    validateRouteAccess();
  }, [location.pathname]);
};