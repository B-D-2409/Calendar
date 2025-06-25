import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import style from './Calendar.module.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Event {
    title: string;
    start: Date;
    end: Date;
}

function Calendar() {
    const [events, setEvents] = useState<Event[]>([
        {
            title: 'Team Meeting',
            start: new Date(2025, 5, 26, 10, 0),
            end: new Date(2025, 5, 26, 11, 0),
        },
        {
            title: 'Deadline',
            start: new Date(2025, 5, 28),
            end: new Date(2025, 5, 28),
        },
    ]);

    return (
        <div className={style.calendar}>
            <h1>Calendar</h1>
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'week', 'work_week', 'day', 'agenda']}
                defaultView="month"
                style={{ height: '75vh' }}
            />
        </div>
    );
}

export default Calendar;
