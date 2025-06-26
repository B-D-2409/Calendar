import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View, type NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import style from './Calendar.module.css';
import YearCalendar from './Year';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface Event {
    title: string;
    start: Date;
    end: Date;
}

function Calendar() {
    const [events, setEvents] = useState<Event[]>([
        { title: 'Team Meeting', start: new Date(2025, 5, 26, 10, 0), end: new Date(2025, 5, 26, 11, 0) },
        { title: 'Deadline', start: new Date(2025, 5, 28), end: new Date(2025, 5, 28) },
    ]);

    const [calendarView, setCalendarView] = useState<View>('month');
    const [isYearView, setIsYearView] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const handlePrevYear = () => setCurrentYear(y => y - 1);
    const handleNextYear = () => setCurrentYear(y => y + 1);

    const changeView = (view: View | 'year') => {
        if (view === 'year') {
            setIsYearView(true);
            setCurrentYear(new Date().getFullYear());
        } else {
            setIsYearView(false);
            setCalendarView(view);
        }
    };

    const handleNavigate = (date: Date, view: View, action: NavigateAction) => {
        setCurrentDate(date);
    };

    return (
        <div className={style.calendar}>
            <h1>Calendar</h1>

            <div style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                {isYearView ? (
                    <>
                        <button onClick={() => changeView('year')} style={{ fontWeight: isYearView ? 'bold' : 'normal' }}>Year</button>
                        <button onClick={() => changeView('month')} style={{ fontWeight: calendarView === 'month' ? 'bold' : 'normal' }}>Month</button>
                        <button onClick={() => changeView('week')} style={{ fontWeight: calendarView === 'week' ? 'bold' : 'normal' }}>Week</button>
                        <button onClick={() => changeView('work_week')} style={{ fontWeight: calendarView === 'work_week' ? 'bold' : 'normal' }}>WorkWeek</button>
                        <button onClick={() => changeView('day')} style={{ fontWeight: calendarView === 'day' ? 'bold' : 'normal' }}>Day</button>
                        <button onClick={() => changeView('agenda')} style={{ fontWeight: calendarView === 'agenda' ? 'bold' : 'normal' }}>Agenda</button>
                    </>
                ) : (
                    <button onClick={() => changeView('year')} style={{ fontWeight: isYearView ? 'bold' : 'normal' }}>Year</button>
                )}
            </div>

            {isYearView && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                    <button onClick={handlePrevYear} style={{ marginRight: 10 }}>←</button>
                    <h2>{currentYear}</h2>
                    <button onClick={handleNextYear} style={{ marginLeft: 10 }}>→</button>
                </div>
            )}

            {isYearView ? (
                <YearCalendar year={currentYear} />
            ) : (
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    views={['month', 'week', 'work_week', 'day', 'agenda']}
                    view={calendarView}
                    date={currentDate}
                    onNavigate={handleNavigate} 
                    onView={(view: View) => setCalendarView(view)}
                    style={{ height: '75vh' }}
                />
            )}
        </div>
    );
}

export default Calendar;
