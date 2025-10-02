import React, { useState } from 'react';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { StudentView } from './StudentView';

const mockClasses = [
  { id: '1', name: 'MECH', department: 'Mechanical Engineering' },
  { id: '2', name: 'CIVIL', department: 'Civil Engineering' },
  { id: '3', name: 'EEE', department: 'Electrical Engineering' },
  { id: '4', name: 'ECE A', department: 'Electronics and Communication' },
  { id: '5', name: 'ECE B', department: 'Electronics and Communication' },
  { id: '6', name: 'IT', department: 'Information Technology' },
  { id: '7', name: 'AIDS A', department: 'Artificial Intelligence and Data Science' },
  { id: '8', name: 'AIDS B', department: 'Artificial Intelligence and Data Science' },
  { id: '9', name: 'AIML', department: 'Artificial Intelligence and Machine Learning' },
  { id: '10', name: 'CSE A', department: 'Computer Science Engineering' },
  { id: '11', name: 'CSE B', department: 'Computer Science Engineering' },
  { id: '12', name: 'CSE C', department: 'Computer Science Engineering' },
];

type StudentLoginProps = {
  onBack: () => void;
};

export const StudentLogin: React.FC<StudentLoginProps> = ({ onBack }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showStudentView, setShowStudentView] = useState(false);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setShowStudentView(true);
  };

  if (showStudentView && selectedClass) {
    const selectedClassData = mockClasses.find((c) => c.id === selectedClass);
    return (
      <StudentView
        classData={selectedClassData!}
        onBack={() => setShowStudentView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Login</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Student Portal</h1>
          <p className="text-gray-600 text-lg">Select your class to view attendance records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleClassSelect(cls.id)}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{cls.name}</h3>
              <p className="text-gray-600 text-sm">{cls.department}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-green-600 font-medium">View Students</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
