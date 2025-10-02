import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Faculty = {
  id: string;
  email: string;
  name: string;
  designation: string;
  department: string;
  password_hash: string;
  created_at: string;
};

export type Class = {
  id: string;
  name: string;
  department: string;
  created_at: string;
};

export type Student = {
  id: string;
  roll_number: string;
  name: string;
  class_id: string;
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

export type Timetable = {
  id: string;
  faculty_id: string;
  class_id: string;
  subject_id: string;
  period_number: number;
  day_of_week: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  student_id: string;
  faculty_id: string;
  subject_id: string;
  class_id: string;
  period_number: number;
  date: string;
  status: 'present' | 'absent' | 'on_duty';
  created_at: string;
  updated_at: string;
};
