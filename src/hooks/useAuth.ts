import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      const hasToken = typeof document !== 'undefined' && 
        document.cookie.split(';').some(c => c.trim().startsWith('access_token='));
      const hasSession = typeof window !== 'undefined' && 
        localStorage.getItem('mhmb_logged_in') === 'true';

      if (!hasToken && !hasSession) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await api.get('/api/users/profile');
        if (isMounted) {
          setUser(response.data.data);
          setServerDown(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch user profile:', err);
        if (!err?.response) {
          // Network error — server is unreachable
          if (isMounted) {
            setServerDown(true);
          }
        } else if (err?.response?.status === 401) {
          // If unauthorized, clean up session
          if (typeof window !== 'undefined') {
            localStorage.removeItem('mhmb_logged_in');
            localStorage.removeItem('mhmb_profile');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, isLoading, serverDown };
}
