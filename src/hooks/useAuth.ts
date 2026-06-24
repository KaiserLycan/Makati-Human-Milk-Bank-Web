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

  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/users/profile');
        if (isMounted) {
          setUser(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
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

  return { user, isLoading };
}
