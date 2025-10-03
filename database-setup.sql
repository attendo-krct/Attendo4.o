-- College Attendance Management System - Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  designation text NOT NULL,
  department text NOT NULL,
  password_hash text NOT NULL DEFAULT 'password123',
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Faculty can read all faculty data" ON faculty;
DROP POLICY IF EXISTS "Anyone can read classes" ON classes;
DROP POLICY IF EXISTS "Anyone can read students" ON students;
DROP POLICY IF EXISTS "Anyone can read subjects" ON subjects;
DROP POLICY IF EXISTS "Anyone can read timetable" ON timetable;
DROP POLICY IF EXISTS "Anyone can read attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can update attendance" ON attendance;

-- RLS Policies
CREATE POLICY "Faculty can read all faculty data"
  ON faculty FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read classes"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read subjects"
  ON subjects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read timetable"
  ON timetable FOR SELECT
  USING (true);

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

-- Insert faculty (password is 'password123' for all)
INSERT INTO faculty (email, name, designation, department, password_hash) VALUES
  ('rajesh@college.edu', 'Dr. Rajesh Kumar', 'Assistant Professor', 'Department of Physics', 'password123'),
  ('priya@college.edu', 'Dr. Priya Sharma', 'Associate Professor', 'Department of Mathematics', 'password123'),
  ('amit@college.edu', 'Prof. Amit Patel', 'Professor', 'Department of Chemistry', 'password123'),
  ('sneha@college.edu', 'Dr. Sneha Reddy', 'Assistant Professor', 'Department of English', 'password123'),
  ('vijay@college.edu', 'Prof. Vijay Kumar', 'Associate Professor', 'Department of Computer Science', 'password123')
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

-- Display summary
DO $$
DECLARE
  faculty_count int;
  classes_count int;
  students_count int;
  subjects_count int;
  timetable_count int;
BEGIN
  SELECT COUNT(*) INTO faculty_count FROM faculty;
  SELECT COUNT(*) INTO classes_count FROM classes;
  SELECT COUNT(*) INTO students_count FROM students;
  SELECT COUNT(*) INTO subjects_count FROM subjects;
  SELECT COUNT(*) INTO timetable_count FROM timetable;

  RAISE NOTICE 'Database setup complete!';
  RAISE NOTICE 'Faculty: %', faculty_count;
  RAISE NOTICE 'Classes: %', classes_count;
  RAISE NOTICE 'Students: %', students_count;
  RAISE NOTICE 'Subjects: %', subjects_count;
  RAISE NOTICE 'Timetable entries: %', timetable_count;
END $$;
