import React, { createContext, useContext, useState, useEffect } from 'react';
import { Faculty, supabase } from '../lib/supabase';

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
    const storedFaculty = localStorage.getItem('faculty');
    if (storedFaculty) {
      setFaculty(JSON.parse(storedFaculty));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: facultyData, error } = await supabase
        .from('faculty')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return false;
      }

      if (!facultyData) {
        console.error('Invalid credentials');
        return false;
      }

      setFaculty(facultyData);
      localStorage.setItem('faculty', JSON.stringify(facultyData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setFaculty(null);
    localStorage.removeItem('faculty');
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
