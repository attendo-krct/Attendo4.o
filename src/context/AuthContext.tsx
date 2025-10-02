import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Faculty } from '../lib/supabase';

type AuthContextType = {
  faculty: Faculty | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: facultyData, error } = await supabase
          .from('faculty')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (facultyData && !error) {
          setFaculty(facultyData);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Authentication error:', authError);
        return false;
      }

      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (facultyError || !facultyData) {
        console.error('Faculty fetch error:', facultyError);
        await supabase.auth.signOut();
        return false;
      }

      setFaculty(facultyData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setFaculty(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ faculty, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
