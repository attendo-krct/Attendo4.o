import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { Faculty, supabase } from '../lib/supabase';
import { CircularProgress } from './CircularProgress';
import * as XLSX from 'xlsx';

type AttendanceRecord = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  present: number;
  absent: number;
  onDuty: number;
  total: number;
  percentage: number;
};

type AttendanceViewProps = {
  faculty: Faculty;
  onBack: () => void;
};

type ClassOption = {
  id: string;
  name: string;
};

export const AttendanceView: React.FC<AttendanceViewProps> = ({ faculty, onBack }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [workingDays, setWorkingDays] = useState(20);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [className, setClassName] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await supabase
          .from('timetable')
          .select('class_id, classes(id, name)')
          .eq('faculty_id', faculty.id);

        if (data) {
          const uniqueClasses = Array.from(
            new Map(data.map((item: any) => [item.classes.id, item.classes])).values()
          );
          setClasses(uniqueClasses as ClassOption[]);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, [faculty.id]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedClass) return;

      setIsLoading(true);
      try {
        const selectedClassData = classes.find((c) => c.id === selectedClass);
        setClassName(selectedClassData?.name || '');

        const { data: students } = await supabase
          .from('students')
          .select('id, roll_number, name')
          .eq('class_id', selectedClass)
          .order('roll_number');

        if (!students) return;

        const attendanceRecords = await Promise.all(
          students.map(async (student) => {
            const { data: attendance } = await supabase
              .from('attendance')
              .select('status')
              .eq('student_id', student.id)
              .eq('faculty_id', faculty.id);

            const present = attendance?.filter((a) => a.status === 'present').length || 0;
            const absent = attendance?.filter((a) => a.status === 'absent').length || 0;
            const onDuty = attendance?.filter((a) => a.status === 'on_duty').length || 0;
            const total = present + absent + onDuty || 1;
            const percentage = (present / total) * 100;

            return {
              studentId: student.id,
              studentName: student.name,
              rollNumber: student.roll_number,
              present,
              absent,
              onDuty,
              total,
              percentage,
            };
          })
        );

        setAttendanceData(attendanceRecords);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedClass, faculty.id, classes]);

  const downloadClassReport = () => {
    const wb = XLSX.utils.book_new();

    const headerData = [
      [''],
      ['COLLEGE ATTENDANCE MANAGEMENT SYSTEM'],
      ['Class Attendance Report'],
      [''],
      ['Class:', className],
      ['Faculty:', faculty.name],
      ['Subject:', faculty.department],
      ['Date:', new Date().toLocaleDateString()],
      [''],
      ['Roll Number', 'Student Name', 'Present', 'Absent', 'On Duty', 'Total', 'Percentage'],
    ];

    const dataRows = attendanceData.map((record) => [
      record.rollNumber,
      record.studentName,
      record.present,
      record.absent,
      record.onDuty,
      record.total,
      `${record.percentage.toFixed(2)}%`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headerData, ...dataRows]);

    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `${className}_Attendance_${faculty.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadStudentReport = (record: AttendanceRecord) => {
    const wb = XLSX.utils.book_new();

    const data = [
      [''],
      ['COLLEGE ATTENDANCE MANAGEMENT SYSTEM'],
      ['Student Attendance Report'],
      [''],
      ['Student Name:', record.studentName],
      ['Roll Number:', record.rollNumber],
      ['Faculty:', faculty.name],
      ['Subject:', faculty.department],
      ['Class:', className],
      ['Date:', new Date().toLocaleDateString()],
      [''],
      ['Status', 'Count'],
      ['Present', record.present],
      ['Absent', record.absent],
      ['On Duty', record.onDuty],
      ['Total Classes', record.total],
      ['Attendance Percentage', `${record.percentage.toFixed(2)}%`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Report');
    XLSX.writeFile(wb, `${record.rollNumber}_${record.studentName}_Attendance.xlsx`);
  };

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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">View Attendance Records</h2>
          <p className="text-gray-600 mb-4">
            Subject: <span className="font-bold">{faculty.department}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days in Month
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(parseInt(e.target.value) || 20)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="31"
                />
              </div>
            </div>
          </div>

          {selectedClass && (
            <button
              onClick={downloadClassReport}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-5 h-5" />
              <span>Download Class Report</span>
            </button>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance data...</p>
          </div>
        )}

        {!isLoading && selectedClass && attendanceData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendanceData.map((record) => (
              <div key={record.studentId} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col items-center mb-4">
                  <CircularProgress percentage={record.percentage} />
                  <h3 className="text-lg font-bold text-gray-800 mt-4">{record.studentName}</h3>
                  <p className="text-gray-600 text-sm">{record.rollNumber}</p>
                </div>

                <div className="space-y-2 mb-4">
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

                <button
                  onClick={() => downloadStudentReport(record)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download Report</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedClass && attendanceData.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">No attendance records found for this class.</p>
          </div>
        )}
      </div>
    </div>
  );
};
