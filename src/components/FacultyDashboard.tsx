import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, Clock, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AttendancePage } from './AttendancePage';
import { AttendanceView } from './AttendanceView';
import { TimetableEditor } from './TimetableEditor';
import { supabase } from '../lib/supabase';

type TimetableEntry = {
  period: number;
  class: string;
  subject: string;
  classId: string;
  subjectId: string;
};

type View = 'dashboard' | 'attendance' | 'view-attendance' | 'timetable-editor';

export const FacultyDashboard: React.FC = () => {
  const { faculty, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<TimetableEntry | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!faculty) return;

      try {
        const { data, error } = await supabase
          .from('timetable')
          .select(`
            period_number,
            class_id,
            subject_id,
            classes (name),
            subjects (name)
          `)
          .eq('faculty_id', faculty.id)
          .eq('day_of_week', 'Monday')
          .order('period_number');

        if (error) {
          console.error('Error fetching timetable:', error);
          return;
        }

        if (data) {
          const formattedTimetable: TimetableEntry[] = data.map((item: any) => ({
            period: item.period_number,
            class: item.classes.name,
            subject: item.subjects.name,
            classId: item.class_id,
            subjectId: item.subject_id,
          }));
          setTimetable(formattedTimetable);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, [faculty]);

  const handlePeriodClick = (period: TimetableEntry) => {
    setSelectedPeriod(period);
    setCurrentView('attendance');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPeriod(null);
  };

  if (currentView === 'attendance' && selectedPeriod) {
    return (
      <AttendancePage
        period={selectedPeriod}
        faculty={faculty!}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'view-attendance') {
    return (
      <AttendanceView
        faculty={faculty!}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'timetable-editor') {
    return (
      <TimetableEditor
        faculty={faculty!}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {faculty?.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{faculty?.name}</h1>
                <p className="text-gray-600">{faculty?.designation}</p>
                <p className="text-gray-500 text-sm">{faculty?.department}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Today's Timetable</h2>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentView('timetable-editor')}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Timetable</span>
            </button>
            <button
              onClick={() => setCurrentView('view-attendance')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Attendance Records</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <p className="text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockTimetable.map((item) => (
            <button
              key={item.period}
              onClick={() => handlePeriodClick(item)}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{item.period}</span>
                </div>
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{item.class}</h3>
              <p className="text-gray-600 font-medium">{item.subject}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-blue-600 font-medium">Click to mark attendance</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
