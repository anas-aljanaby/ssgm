import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock,
  Download,
  FileText,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { ShariaMeeting } from '../../../types';
import { MOCK_SHARIA_BOARD_MEMBERS, MOCK_SHARIA_MEETINGS } from '../../../data/shariaBoardData';
import { formatDate } from '../../../lib/utils';

type ScheduleMeetingInput = {
  title: { en: string; ar: string };
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
  agenda: {
    topic: { en: string; ar: string };
    presenter: string;
  }[];
};

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMeeting: (meeting: ScheduleMeetingInput) => void;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onAddMeeting,
}) => {
  const { t, language } = useLocalization(['sharia', 'common']);
  const defaultAttendeeIds = MOCK_SHARIA_BOARD_MEMBERS.filter((member) => member.status === 'Active').map((member) => member.id);
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>(defaultAttendeeIds);
  const [agendaTopicEn, setAgendaTopicEn] = useState('');
  const [agendaTopicAr, setAgendaTopicAr] = useState('');
  const [agendaPresenter, setAgendaPresenter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!titleEn.trim() && !titleAr.trim()) || !date || !startTime || !endTime || !location.trim()) return;

    setIsSubmitting(true);
    const agenda =
      agendaTopicEn.trim() || agendaTopicAr.trim()
        ? [{
            topic: {
              en: agendaTopicEn.trim() || agendaTopicAr.trim(),
              ar: agendaTopicAr.trim() || agendaTopicEn.trim(),
            },
            presenter: agendaPresenter.trim() || t('sharia.board.meetings.form.presenterFallback'),
          }]
        : [];

    onAddMeeting({
      title: {
        en: titleEn.trim() || titleAr.trim(),
        ar: titleAr.trim() || titleEn.trim(),
      },
      date: new Date(date).toISOString(),
      startTime,
      endTime,
      location: location.trim(),
      attendees: attendeeIds,
      agenda,
    });
    setTitleEn('');
    setTitleAr('');
    setLocation('');
    setAttendeeIds(defaultAttendeeIds);
    setAgendaTopicEn('');
    setAgendaTopicAr('');
    setAgendaPresenter('');
    setIsSubmitting(false);
    onClose();
  };

  const toggleAttendee = (memberId: string) => {
    setAttendeeIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold">{t('sharia.board.meetings.schedule')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-145px)]">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.titleEn')}</span>
              <input
                type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                required
                className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
              />
              </label>
              <label className="block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.titleAr')}</span>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  dir="rtl"
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.date')}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.location')}</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('sharia.board.meetings.form.locationPlaceholder')}
                  required
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.startTime')}</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.endTime')}</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium">{t('sharia.board.meetings.form.attendees')}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MOCK_SHARIA_BOARD_MEMBERS.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={attendeeIds.includes(member.id)}
                      onChange={() => toggleAttendee(member.id)}
                      className="rounded border-gray-300 text-secondary focus:ring-secondary"
                    />
                    <span>{member.name[language]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <p className="text-sm font-bold">{t('sharia.board.meetings.form.agendaSection')}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('sharia.board.meetings.form.agendaHint')}</p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium">{t('sharia.board.meetings.form.agendaTopicEn')}</span>
                  <input
                    type="text"
                    value={agendaTopicEn}
                    onChange={(e) => setAgendaTopicEn(e.target.value)}
                    placeholder={t('sharia.board.meetings.form.agendaPlaceholder')}
                    className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium">{t('sharia.board.meetings.form.agendaTopicAr')}</span>
                  <input
                    type="text"
                    value={agendaTopicAr}
                    onChange={(e) => setAgendaTopicAr(e.target.value)}
                    dir="rtl"
                    className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                  />
                </label>
              </div>
              <label className="mt-3 block">
                <span className="block text-sm font-medium">{t('sharia.board.meetings.form.agendaPresenter')}</span>
                <input
                  type="text"
                  value={agendaPresenter}
                  onChange={(e) => setAgendaPresenter(e.target.value)}
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </label>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold disabled:opacity-60"
            >
              {t('sharia.board.meetings.schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MeetingsTab: React.FC = () => {
  const { t, language } = useLocalization(['sharia', 'common', 'leadership']);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetings, setMeetings] = useState<ShariaMeeting[]>(MOCK_SHARIA_MEETINGS);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ShariaMeeting | null>(null);

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, ShariaMeeting[]>();
    meetings.forEach((meeting) => {
      const key = new Date(meeting.date).toISOString().split('T')[0];
      const existing = map.get(key) ?? [];
      existing.push(meeting);
      map.set(key, existing);
    });
    return map;
  }, [meetings]);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });

  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, i + 1).toLocaleDateString(language, { weekday: 'short' }),
  );

  const handleAddMeeting = (input: ScheduleMeetingInput) => {
    const newMeeting: ShariaMeeting = {
      ...input,
      id: `sm-${Date.now()}`,
    };
    setMeetings((prev) => [...prev, newMeeting]);
  };

  return (
    <>
      <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {currentMonth.toLocaleDateString(language, { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth((prev) => {
                    const next = new Date(prev);
                    next.setMonth(next.getMonth() - 1);
                    return next;
                  })
                }
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth((prev) => {
                    const next = new Date(prev);
                    next.setMonth(next.getMonth() + 1);
                    return next;
                  })
                }
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg"
          >
            <CirclePlus size={18} />
            {t('sharia.board.meetings.schedule')}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700 border dark:border-slate-700 rounded-lg overflow-hidden">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="text-center py-2 bg-gray-50 dark:bg-slate-800 text-xs font-bold uppercase"
            >
              {label}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dateKey = day.toISOString().split('T')[0];
            const dayMeetings = meetingsByDate.get(dateKey) ?? [];
            const inMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={dateKey}
                className={`p-2 h-32 bg-card dark:bg-dark-card overflow-y-auto ${
                  inMonth ? '' : 'bg-gray-50 dark:bg-slate-800/50'
                }`}
              >
                <span
                  className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${
                    isToday ? 'bg-sharia-secondary text-white' : ''
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayMeetings.map((meeting) => (
                    <button
                      key={meeting.id}
                      type="button"
                      onClick={() => setSelectedMeeting(meeting)}
                      className="w-full text-left p-1 bg-sharia-primary/20 rounded-md text-xs truncate"
                      title={meeting.title[language]}
                    >
                      {meeting.title[language]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onAddMeeting={handleAddMeeting}
      />

      {selectedMeeting && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setSelectedMeeting(null)}
        >
          <div
            className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 p-6 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold">{selectedMeeting.title[language]}</h2>
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <strong>{t('leadership.eventTime')}:</strong>
                  {selectedMeeting.startTime} - {selectedMeeting.endTime}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <strong>{t('common.date')}:</strong>
                  {formatDate(selectedMeeting.date, language)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <strong>{t('leadership.eventLocation')}:</strong>
                  {selectedMeeting.location}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Users size={18} />
                  {t('sharia.board.members.title')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 ? (
                    selectedMeeting.attendees.map((attendeeId) => {
                      const member = MOCK_SHARIA_BOARD_MEMBERS.find((m) => m.id === attendeeId);
                      return member ? (
                        <span
                          key={attendeeId}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full"
                        >
                          {member.name[language]}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.board.meetings.noAttendees')}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <FileText size={18} />
                  {t('sharia.meetings.agenda')}
                </h3>
                {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {selectedMeeting.agenda.map((item, index) => (
                      <li key={index}>
                        <strong>{item.topic[language]}</strong> ({t('sharia.meetings.presenter')}:{' '}
                        {item.presenter})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.board.meetings.noAgenda')}</p>
                )}
              </div>
            </div>

            {selectedMeeting.minutesUrl && (
              <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-end flex-shrink-0">
                <a
                  href={selectedMeeting.minutesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg"
                >
                  <Download size={16} />
                  {t('sharia.meetings.downloadMinutes')}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MeetingsTab;
