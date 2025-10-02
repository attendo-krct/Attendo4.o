import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, User } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { supabase } from '../lib/supabase';

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



export const StudentView: React.FC<StudentViewProps> = ({ classData, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<FacultyAttendance[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classData.id]);

  useEffect(() => {
    if (selectedStudent) {
      fetchAttendance(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, roll_number, name')
        .eq('class_id', classData.id)
        .order('roll_number');

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      if (data) {
        const formattedStudents: Student[] = data.map((student) => ({
          id: student.id,
          rollNumber: student.roll_number,
          name: student.name,
        }));
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchAttendance = async (studentId: string) => {
    try {
      setIsLoadingAttendance(true);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          status,
          faculty:faculty_id (name),
          subject:subject_id (name)
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      if (data) {
        const attendanceByFaculty = new Map<string, {
          facultyName: string;
          subject: string;
          present: number;
          absent: number;
          onDuty: number;
        }>();

        data.forEach((record: any) => {
          const facultyName = record.faculty?.name || 'Unknown';
          const subject = record.subject?.name || 'Unknown';
          const key = `${facultyName}-${subject}`;

          if (!attendanceByFaculty.has(key)) {
            attendanceByFaculty.set(key, {
              facultyName,
              subject,
              present: 0,
              absent: 0,
              onDuty: 0,
            });
          }

          const stats = attendanceByFaculty.get(key)!;
          if (record.status === 'present') stats.present++;
          else if (record.status === 'absent') stats.absent++;
          else if (record.status === 'on_duty') stats.onDuty++;
        });

        const records: FacultyAttendance[] = Array.from(attendanceByFaculty.values()).map(
          (stats) => {
            const total = stats.present + stats.absent + stats.onDuty;
            const percentage = total > 0 ? (stats.present / total) * 100 : 0;
            return {
              ...stats,
              total,
              percentage,
            };
          }
        );

        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

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

  const downloadClassReport = async () => {
    const allStudentsData: string[][] = [
      ['Class Attendance Report'],
      [''],
      ['Class', classData.name],
      ['Department', classData.department],
      [''],
    ];

    for (const student of students) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            status,
            faculty:faculty_id (name),
            subject:subject_id (name)
          `)
          .eq('student_id', student.id);

        if (error || !data) continue;

        const attendanceByFaculty = new Map<string, {
          facultyName: string;
          subject: string;
          present: number;
          absent: number;
          onDuty: number;
        }>();

        data.forEach((record: any) => {
          const facultyName = record.faculty?.name || 'Unknown';
          const subject = record.subject?.name || 'Unknown';
          const key = `${facultyName}-${subject}`;

          if (!attendanceByFaculty.has(key)) {
            attendanceByFaculty.set(key, {
              facultyName,
              subject,
              present: 0,
              absent: 0,
              onDuty: 0,
            });
          }

          const stats = attendanceByFaculty.get(key)!;
          if (record.status === 'present') stats.present++;
          else if (record.status === 'absent') stats.absent++;
          else if (record.status === 'on_duty') stats.onDuty++;
        });

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

        Array.from(attendanceByFaculty.values()).forEach((stats) => {
          const total = stats.present + stats.absent + stats.onDuty;
          const percentage = total > 0 ? (stats.present / total) * 100 : 0;
          allStudentsData.push([
            stats.facultyName,
            stats.subject,
            stats.present.toString(),
            stats.absent.toString(),
            stats.onDuty.toString(),
            total.toString(),
            `${percentage.toFixed(2)}%`,
          ]);
        });
      } catch (err) {
        console.error('Error fetching attendance for student:', student.name, err);
      }
    }

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
            {isLoadingStudents ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No students found</p>
              </div>
            ) : (
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
            )}
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
                  {isLoadingAttendance ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading attendance records...</p>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No attendance records found</p>
                    </div>
                  ) : (
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
                  )}
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
