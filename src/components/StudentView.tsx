import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, User } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

type ClassData = {
  id: string;
  name: string;
  department: string;
};

type Student = {
  id: string;
  rollNumber: string;
  name: string;
};

type FacultyAttendance = {
  facultyName: string;
  subject: string;
  present: number;
  absent: number;
  onDuty: number;
  total: number;
  percentage: number;
};

type StudentViewProps = {
  classData: ClassData;
  onBack: () => void;
};

const mockStudents: Student[] = [
  { id: '1', rollNumber: '21A01', name: 'Aarav Sharma' },
  { id: '2', rollNumber: '21A02', name: 'Diya Patel' },
  { id: '3', rollNumber: '21A03', name: 'Arjun Reddy' },
  { id: '4', rollNumber: '21A04', name: 'Ananya Iyer' },
  { id: '5', rollNumber: '21A05', name: 'Rohan Kumar' },
  { id: '6', rollNumber: '21A06', name: 'Priya Singh' },
  { id: '7', rollNumber: '21A07', name: 'Karthik Menon' },
  { id: '8', rollNumber: '21A08', name: 'Meera Nair' },
  { id: '9', rollNumber: '21A09', name: 'Aditya Verma' },
  { id: '10', rollNumber: '21A10', name: 'Ishita Gupta' },
];

const generateMockFacultyAttendance = (): FacultyAttendance[] => {
  const faculties = [
    { name: 'Dr. Rajesh Kumar', subject: 'Physics' },
    { name: 'Dr. Priya Sharma', subject: 'Mathematics' },
    { name: 'Prof. Amit Patel', subject: 'Chemistry' },
    { name: 'Dr. Sneha Reddy', subject: 'English' },
    { name: 'Prof. Vijay Kumar', subject: 'Programming' },
  ];

  return faculties.map((faculty) => {
    const total = 20;
    const present = Math.floor(Math.random() * 8) + 12;
    const absent = Math.floor(Math.random() * 4);
    const onDuty = total - present - absent;
    const percentage = (present / total) * 100;

    return {
      facultyName: faculty.name,
      subject: faculty.subject,
      present,
      absent,
      onDuty,
      total,
      percentage,
    };
  });
};

export const StudentView: React.FC<StudentViewProps> = ({ classData, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<FacultyAttendance[]>([]);

  useEffect(() => {
    setStudents(mockStudents);
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      setAttendanceRecords(generateMockFacultyAttendance());
    }
  }, [selectedStudent]);

  const downloadStudentReport = () => {
    if (!selectedStudent) return;

    const csvContent = [
      ['Student Attendance Report'],
      [''],
      ['Student Name', selectedStudent.name],
      ['Roll Number', selectedStudent.rollNumber],
      ['Class', classData.name],
      ['Department', classData.department],
      [''],
      ['Faculty Name', 'Subject', 'Present', 'Absent', 'On Duty', 'Total', 'Percentage'],
      ...attendanceRecords.map((record) => [
        record.facultyName,
        record.subject,
        record.present,
        record.absent,
        record.onDuty,
        record.total,
        `${record.percentage.toFixed(2)}%`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedStudent.rollNumber}_${selectedStudent.name}_Complete_Attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadClassReport = () => {
    const allStudentsData: string[][] = [
      ['Class Attendance Report'],
      [''],
      ['Class', classData.name],
      ['Department', classData.department],
      [''],
    ];

    students.forEach((student) => {
      const records = generateMockFacultyAttendance();
      allStudentsData.push(['']);
      allStudentsData.push([`Student: ${student.name} (${student.rollNumber})`]);
      allStudentsData.push([
        'Faculty Name',
        'Subject',
        'Present',
        'Absent',
        'On Duty',
        'Total',
        'Percentage',
      ]);
      records.forEach((record) => {
        allStudentsData.push([
          record.facultyName,
          record.subject,
          record.present.toString(),
          record.absent.toString(),
          record.onDuty.toString(),
          record.total.toString(),
          `${record.percentage.toFixed(2)}%`,
        ]);
      });
    });

    const csvContent = allStudentsData.map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name}_Complete_Attendance_Report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Classes</span>
            </button>
            <button
              onClick={downloadClassReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Class Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{classData.name}</h2>
          <p className="text-gray-600">{classData.department}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Students</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedStudent?.id === student.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{student.name}</p>
                  <p className={`text-sm ${selectedStudent?.id === student.id ? 'text-green-100' : 'text-gray-600'}`}>
                    {student.rollNumber}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h3>
                        <p className="text-gray-600">{selectedStudent.rollNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadStudentReport}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Faculty-wise Attendance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attendanceRecords.map((record, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex flex-col items-center mb-4">
                          <CircularProgress percentage={record.percentage} size={100} strokeWidth={6} />
                          <h5 className="text-lg font-bold text-gray-800 mt-3">{record.facultyName}</h5>
                          <p className="text-gray-600 text-sm">{record.subject}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Present:</span>
                            <span className="font-bold text-green-600">{record.present}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Absent:</span>
                            <span className="font-bold text-red-600">{record.absent}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">On Duty:</span>
                            <span className="font-bold text-yellow-600">{record.onDuty}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-700">Total:</span>
                            <span className="font-bold text-gray-800">{record.total}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Select a student to view their attendance records</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
