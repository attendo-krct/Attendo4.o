import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Save, UserCheck } from 'lucide-react';
import { Faculty, supabase } from '../lib/supabase';

type Student = {
  id: string;
  roll_number: string;
  name: string;
  status: 'present' | 'absent' | 'on_duty';
};

type AttendancePageProps = {
  period: {
    period: number;
    class: string;
    subject: string;
    classId: string;
    subjectId: string;
  };
  faculty: Faculty;
  onBack: () => void;
};


export const AttendancePage: React.FC<AttendancePageProps> = ({ period, faculty, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [period.classId]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, roll_number, name')
        .eq('class_id', period.classId)
        .order('roll_number');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      if (!studentsData) return;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', period.classId)
        .eq('faculty_id', faculty.id)
        .eq('subject_id', period.subjectId)
        .eq('period_number', period.period)
        .eq('date', today);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      }

      const attendanceMap = new Map(
        attendanceData?.map(a => [a.student_id, a.status]) || []
      );

      const studentsWithStatus: Student[] = studentsData.map((student) => ({
        id: student.id,
        roll_number: student.roll_number,
        name: student.name,
        status: (attendanceMap.get(student.id) as 'present' | 'absent' | 'on_duty') || 'present',
      }));

      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusClick = (student: Student) => {
    if (student.status === 'present') {
      setSelectedStudent(student);
      setShowAbsentModal(true);
    } else {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, status: 'present' } : s
        )
      );
    }
  };

  const handleAbsentSelection = (type: 'absent' | 'on_duty') => {
    if (selectedStudent) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id ? { ...s, status: type } : s
        )
      );
      setShowAbsentModal(false);
      setSelectedStudent(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRecords = students.map((student) => ({
        student_id: student.id,
        faculty_id: faculty.id,
        subject_id: period.subjectId,
        class_id: period.classId,
        period_number: period.period,
        date: today,
        status: student.status,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,faculty_id,subject_id,class_id,period_number,date',
        });

      if (error) {
        console.error('Error saving attendance:', error);
        alert('Failed to save attendance. Please try again.');
        return;
      }

      alert('Attendance saved successfully!');
      onBack();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const onDutyCount = students.filter((s) => s.status === 'on_duty').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : (
          <>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-sm text-gray-600 mb-1">Period</h2>
              <p className="text-2xl font-bold text-blue-600">Period {period.period}</p>
            </div>
            <div>
              <h2 className="text-sm text-gray-600 mb-1">Class</h2>
              <p className="text-2xl font-bold text-gray-800">{period.class}</p>
            </div>
            <div>
              <h2 className="text-sm text-gray-600 mb-1">Subject</h2>
              <p className="text-2xl font-bold text-gray-800">{period.subject}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Present</p>
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              </div>
              <Check className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Absent</p>
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              </div>
              <X className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">On Duty</p>
                <p className="text-3xl font-bold text-yellow-600">{onDutyCount}</p>
              </div>
              <UserCheck className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.roll_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleStatusClick(student)}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                          student.status === 'present'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : student.status === 'absent'
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                      >
                        {student.status === 'present'
                          ? 'Present'
                          : student.status === 'absent'
                          ? 'Absent'
                          : 'On Duty'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>

      {showAbsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Mark Status</h3>
            <p className="text-gray-600 mb-6">
              Select status for <span className="font-bold">{selectedStudent?.name}</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAbsentSelection('absent')}
                className="w-full px-6 py-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
              >
                Absent
              </button>
              <button
                onClick={() => handleAbsentSelection('on_duty')}
                className="w-full px-6 py-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition"
              >
                On Duty
              </button>
              <button
                onClick={() => {
                  setShowAbsentModal(false);
                  setSelectedStudent(null);
                }}
                className="w-full px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
