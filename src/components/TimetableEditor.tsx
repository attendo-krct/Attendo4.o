import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Calendar } from 'lucide-react';
import { Faculty, supabase } from '../lib/supabase';

type TimetableEntry = {
  id?: string;
  period_number: number;
  day_of_week: string;
  class_id: string;
  class_name?: string;
  subject_id: string;
  subject_name?: string;
};

type ClassOption = {
  id: string;
  name: string;
};

type SubjectOption = {
  id: string;
  name: string;
};

type TimetableEditorProps = {
  faculty: Faculty;
  onBack: () => void;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const TimetableEditor: React.FC<TimetableEditorProps> = ({ faculty, onBack }) => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, subjectsRes, timetableRes] = await Promise.all([
          supabase.from('classes').select('id, name').order('name'),
          supabase.from('subjects').select('id, name').order('name'),
          supabase
            .from('timetable')
            .select(`
              id,
              period_number,
              day_of_week,
              class_id,
              subject_id,
              classes (name),
              subjects (name)
            `)
            .eq('faculty_id', faculty.id),
        ]);

        if (classesRes.data) setClasses(classesRes.data);
        if (subjectsRes.data) setSubjects(subjectsRes.data);

        if (timetableRes.data) {
          const formatted = timetableRes.data.map((item: any) => ({
            id: item.id,
            period_number: item.period_number,
            day_of_week: item.day_of_week,
            class_id: item.class_id,
            class_name: item.classes?.name,
            subject_id: item.subject_id,
            subject_name: item.subjects?.name,
          }));
          setTimetable(formatted);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [faculty.id]);

  const getTimetableForDay = (day: string) => {
    return PERIODS.map((period) => {
      const entry = timetable.find(
        (t) => t.day_of_week === day && t.period_number === period
      );
      return entry || { period_number: period, day_of_week: day, class_id: '', subject_id: '' };
    });
  };

  const handleUpdate = (period: number, field: 'class_id' | 'subject_id', value: string) => {
    setTimetable((prev) => {
      const existing = prev.find(
        (t) => t.day_of_week === selectedDay && t.period_number === period
      );

      if (existing) {
        return prev.map((t) =>
          t.day_of_week === selectedDay && t.period_number === period
            ? { ...t, [field]: value }
            : t
        );
      } else {
        return [
          ...prev,
          {
            period_number: period,
            day_of_week: selectedDay,
            class_id: field === 'class_id' ? value : '',
            subject_id: field === 'subject_id' ? value : '',
          },
        ];
      }
    });
  };

  const handleDelete = (period: number) => {
    setTimetable((prev) =>
      prev.filter((t) => !(t.day_of_week === selectedDay && t.period_number === period))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const entriesToSave = timetable.filter(
        (t) => t.class_id && t.subject_id && t.day_of_week === selectedDay
      );

      for (const entry of entriesToSave) {
        const record = {
          faculty_id: faculty.id,
          class_id: entry.class_id,
          subject_id: entry.subject_id,
          period_number: entry.period_number,
          day_of_week: entry.day_of_week,
        };

        if (entry.id) {
          await supabase.from('timetable').update(record).eq('id', entry.id);
        } else {
          await supabase.from('timetable').insert(record);
        }
      }

      const periodsToDelete = PERIODS.filter(
        (period) =>
          !entriesToSave.some(
            (t) => t.period_number === period && t.day_of_week === selectedDay
          )
      );

      for (const period of periodsToDelete) {
        await supabase
          .from('timetable')
          .delete()
          .eq('faculty_id', faculty.id)
          .eq('day_of_week', selectedDay)
          .eq('period_number', period);
      }

      alert('Timetable saved successfully!');

      const { data } = await supabase
        .from('timetable')
        .select(`
          id,
          period_number,
          day_of_week,
          class_id,
          subject_id,
          classes (name),
          subjects (name)
        `)
        .eq('faculty_id', faculty.id);

      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          period_number: item.period_number,
          day_of_week: item.day_of_week,
          class_id: item.class_id,
          class_name: item.classes?.name,
          subject_id: item.subject_id,
          subject_name: item.subjects?.name,
        }));
        setTimetable(formatted);
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Error saving timetable. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      </div>
    );
  }

  const dayTimetable = getTimetableForDay(selectedDay);

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
              <span>{isSaving ? 'Saving...' : 'Save Timetable'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Timetable Editor</h2>
          </div>
          <p className="text-gray-600">Manage your weekly class schedule</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  selectedDay === day
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dayTimetable.map((entry) => (
                  <tr key={entry.period_number} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">{entry.period_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={entry.class_id}
                        onChange={(e) =>
                          handleUpdate(entry.period_number, 'class_id', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={entry.subject_id}
                        onChange={(e) =>
                          handleUpdate(entry.period_number, 'subject_id', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(entry.period_number)}
                        className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
