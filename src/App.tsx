import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FacultyLogin } from './components/FacultyLogin';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentLogin } from './components/StudentLogin';
import { Users, GraduationCap } from 'lucide-react';

function AppContent() {
  const { faculty, isLoading } = useAuth();
  const [showStudentPortal, setShowStudentPortal] = useState(false);
  const [loginType, setLoginType] = useState<'faculty' | 'student' | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showStudentPortal) {
    return <StudentLogin onBack={() => setShowStudentPortal(false)} />;
  }

  if (faculty) {
    return <FacultyDashboard />;
  }

  if (loginType === 'faculty') {
    return <FacultyLogin onLoginSuccess={() => setLoginType(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          College Attendance Management System
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          A comprehensive solution for tracking and managing student attendance
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => setLoginType('faculty')}
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Faculty Login</h2>
            <p className="text-gray-600 mb-6">
              Mark attendance, view records, and manage your classes
            </p>
            <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
              Login as Faculty
            </div>
          </button>

          <button
            onClick={() => setShowStudentPortal(true)}
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Student Portal</h2>
            <p className="text-gray-600 mb-6">
              View your attendance records and download reports
            </p>
            <div className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium">
              Access Student Portal
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
