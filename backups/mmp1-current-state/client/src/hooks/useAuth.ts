import { useState, useEffect } from "react";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: 'admin' | 'user';
  subscriptionStatus?: string;
  company?: string;
  stripeCustomerId?: string;
  paymentMethodId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include"
        });
        
        if (!mounted) return;
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
