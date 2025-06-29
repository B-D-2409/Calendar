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

const allViews: View[] = ['month', 'week', 'work_week', 'day', 'agenda'];

function Calendar() {
    const [events] = useState<Event[]>([
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
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    padding: '0 16px',
                }}
            >
                <div style={{ display: 'flex', gap: 8 }}>
                    {isYearView &&
                        allViews.map(v => (
                            <button
                            className={style.viewButtons}
                                key={v}
                                onClick={() => changeView(v)}
                                style={{ fontWeight: calendarView === v ? 'bold' : 'normal' }}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                </div>


                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        className={`${style.yearButton} ${isYearView ? style.yearButtonYearView : ''}`}
                        onClick={() => changeView('year')}
                        style={{ fontWeight: isYearView ? 'bold' : 'normal' }}
                    >
                        Year
                    </button>



                    {isYearView && (
                        <>
                            <button className={style.prevYear} onClick={handlePrevYear}>←</button>
                            <h2 className={style.year} style={{ margin: 0 }}>{currentYear}</h2>
                            <button className={style.nextYear} onClick={handleNextYear}>→</button>
                        </>
                    )}
                </div>
            </div>
            <div style={{ height: '75vh' }}>
                {isYearView ? (
                    <YearCalendar year={currentYear} />
                ) : (
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        views={allViews}
                        view={calendarView}
                        date={currentDate}
                        onNavigate={handleNavigate}
                        onView={(view: View) => setCalendarView(view)}
                        style={{ height: '100%' }}
                    />
                )}
            </div>
        </div>
    );

}

export default Calendar;
