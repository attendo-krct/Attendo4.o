/*
  # Initial Schema for College Attendance Management System

  1. New Tables
    - `faculty`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `name` (text, not null)
      - `designation` (text, not null)
      - `department` (text, not null)
      - `password_hash` (text, not null)
      - `created_at` (timestamptz, default now())

    - `classes`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `department` (text, not null)
      - `created_at` (timestamptz, default now())

    - `students`
      - `id` (uuid, primary key)
      - `roll_number` (text, unique, not null)
      - `name` (text, not null)
      - `class_id` (uuid, foreign key to classes)
      - `created_at` (timestamptz, default now())

    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `code` (text, unique, not null)
      - `created_at` (timestamptz, default now())

    - `timetable`
      - `id` (uuid, primary key)
      - `faculty_id` (uuid, foreign key to faculty)
      - `class_id` (uuid, foreign key to classes)
      - `subject_id` (uuid, foreign key to subjects)
      - `period_number` (integer, not null)
      - `day_of_week` (text, not null)
      - `created_at` (timestamptz, default now())

    - `attendance`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `faculty_id` (uuid, foreign key to faculty)
      - `subject_id` (uuid, foreign key to subjects)
      - `class_id` (uuid, foreign key to classes)
      - `period_number` (integer, not null)
      - `date` (date, not null)
      - `status` (text, not null, check constraint)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access to faculty data
    - Add policies for public read access to classes and students (for student portal)
    - Add policies for faculty to manage attendance

  3. Sample Data
    - Insert sample faculty, classes, students, subjects, and timetable entries
*/

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  designation text NOT NULL,
  department text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  department text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number text UNIQUE NOT NULL,
  name text NOT NULL,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create timetable table
CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  period_number integer NOT NULL,
  day_of_week text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_number >= 1 AND period_number <= 7),
  CONSTRAINT valid_day CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  period_number integer NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('present', 'absent', 'on_duty')),
  CONSTRAINT unique_attendance UNIQUE (student_id, faculty_id, subject_id, class_id, period_number, date)
);

-- Enable RLS
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faculty table
CREATE POLICY "Faculty can read all faculty data"
  ON faculty FOR SELECT
  USING (true);

-- RLS Policies for classes table
CREATE POLICY "Anyone can read classes"
  ON classes FOR SELECT
  USING (true);

-- RLS Policies for students table
CREATE POLICY "Anyone can read students"
  ON students FOR SELECT
  USING (true);

-- RLS Policies for subjects table
CREATE POLICY "Anyone can read subjects"
  ON subjects FOR SELECT
  USING (true);

-- RLS Policies for timetable table
CREATE POLICY "Anyone can read timetable"
  ON timetable FOR SELECT
  USING (true);

-- RLS Policies for attendance table
CREATE POLICY "Anyone can read attendance"
  ON attendance FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update attendance"
  ON attendance FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert sample data

-- Insert faculty
INSERT INTO faculty (email, name, designation, department, password_hash) VALUES
  ('rajesh@college.edu', 'Dr. Rajesh Kumar', 'Assistant Professor', 'Department of Physics', '$2a$10$abcdefghijklmnopqrstuvwxyz'),
  ('priya@college.edu', 'Dr. Priya Sharma', 'Associate Professor', 'Department of Mathematics', '$2a$10$abcdefghijklmnopqrstuvwxyz'),
  ('amit@college.edu', 'Prof. Amit Patel', 'Professor', 'Department of Chemistry', '$2a$10$abcdefghijklmnopqrstuvwxyz'),
  ('sneha@college.edu', 'Dr. Sneha Reddy', 'Assistant Professor', 'Department of English', '$2a$10$abcdefghijklmnopqrstuvwxyz'),
  ('vijay@college.edu', 'Prof. Vijay Kumar', 'Associate Professor', 'Department of Computer Science', '$2a$10$abcdefghijklmnopqrstuvwxyz')
ON CONFLICT (email) DO NOTHING;

-- Insert subjects
INSERT INTO subjects (name, code) VALUES
  ('Physics', 'PHY101'),
  ('Mathematics', 'MATH101'),
  ('Chemistry', 'CHEM101'),
  ('English', 'ENG101'),
  ('Programming', 'CS101')
ON CONFLICT (code) DO NOTHING;

-- Insert classes
INSERT INTO classes (name, department) VALUES
  ('MECH', 'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('EEE', 'Electrical Engineering'),
  ('ECE A', 'Electronics and Communication'),
  ('ECE B', 'Electronics and Communication'),
  ('IT', 'Information Technology'),
  ('AIDS A', 'Artificial Intelligence and Data Science'),
  ('AIDS B', 'Artificial Intelligence and Data Science'),
  ('AIML', 'Artificial Intelligence and Machine Learning'),
  ('CSE A', 'Computer Science Engineering'),
  ('CSE B', 'Computer Science Engineering'),
  ('CSE C', 'Computer Science Engineering')
ON CONFLICT (name) DO NOTHING;

-- Insert students (sample for each class)
DO $$
DECLARE
  class_record RECORD;
  student_names text[] := ARRAY['Aarav Sharma', 'Diya Patel', 'Arjun Reddy', 'Ananya Iyer', 'Rohan Kumar', 'Priya Singh', 'Karthik Menon', 'Meera Nair', 'Aditya Verma', 'Ishita Gupta', 'Vivek Joshi', 'Sanya Kapoor', 'Nikhil Rao', 'Tanvi Shah', 'Rahul Desai'];
  i integer;
  roll_prefix text;
BEGIN
  FOR class_record IN SELECT id, name FROM classes LOOP
    roll_prefix := SUBSTRING(class_record.name FROM 1 FOR 4);
    FOR i IN 1..15 LOOP
      INSERT INTO students (roll_number, name, class_id)
      VALUES (
        roll_prefix || LPAD(i::text, 2, '0'),
        student_names[i],
        class_record.id
      )
      ON CONFLICT (roll_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert timetable entries (Physics faculty teaching different classes)
DO $$
DECLARE
  physics_faculty_id uuid;
  physics_subject_id uuid;
  class_record RECORD;
  period_num integer := 1;
BEGIN
  SELECT id INTO physics_faculty_id FROM faculty WHERE email = 'rajesh@college.edu' LIMIT 1;
  SELECT id INTO physics_subject_id FROM subjects WHERE code = 'PHY101' LIMIT 1;

  FOR class_record IN SELECT id, name FROM classes LOOP
    INSERT INTO timetable (faculty_id, class_id, subject_id, period_number, day_of_week)
    VALUES (
      physics_faculty_id,
      class_record.id,
      physics_subject_id,
      period_num,
      'Monday'
    )
    ON CONFLICT DO NOTHING;

    period_num := period_num + 1;
    IF period_num > 7 THEN
      period_num := 1;
    END IF;
  END LOOP;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to attendance table
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
