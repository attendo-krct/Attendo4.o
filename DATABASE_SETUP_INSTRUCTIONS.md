# Database Setup Instructions

The app is trying to fetch data from Supabase but the tables haven't been created yet. Follow these steps to set up your database:

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Setup Script

1. Click "New Query" button
2. Copy the entire contents of `database-setup.sql` file
3. Paste it into the SQL editor
4. Click "Run" button (or press Ctrl+Enter)

## Step 3: Verify Setup

After running the script, you should see a success message. The database will contain:

- **5 Faculty members** (for testing login)
- **12 Classes** (MECH, CIVIL, EEE, ECE A, ECE B, IT, AIDS A, AIDS B, AIML, CSE A, CSE B, CSE C)
- **15 Students per class** (180 students total)
- **5 Subjects** (Physics, Mathematics, Chemistry, English, Programming)
- **Timetable entries** for Physics faculty across all classes

## Step 4: Test Faculty Login

You can now test the faculty login with any of these credentials:

| Email | Password | Name | Department |
|-------|----------|------|------------|
| rajesh@college.edu | password123 | Dr. Rajesh Kumar | Department of Physics |
| priya@college.edu | password123 | Dr. Priya Sharma | Department of Mathematics |
| amit@college.edu | password123 | Prof. Amit Patel | Department of Chemistry |
| sneha@college.edu | password123 | Dr. Sneha Reddy | Department of English |
| vijay@college.edu | password123 | Prof. Vijay Kumar | Department of Computer Science |

## What's Next?

After setting up the database:
1. Login as a faculty member (use any email above with password: password123)
2. You'll see the timetable for today (Monday by default)
3. Click on a period to mark attendance
4. Student portal will show all classes and their students

## Troubleshooting

If you see errors like "Could not find the table 'public.faculty' in the schema cache":
- Make sure you ran the SQL script in the Supabase SQL Editor
- Check that all tables were created successfully
- You may need to refresh the schema cache (this happens automatically after a few seconds)

## Note on Authentication

The current implementation uses simple email lookup for faculty authentication (no password verification). In production, you should implement proper password hashing and authentication using Supabase Auth.
