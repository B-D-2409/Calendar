import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parseISO, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import style from './Calendar.module.css';
import YearCalendar from './Year';

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

// Localizer configuration for BigCalendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse: parseISO, startOfWeek, getDay, locales });

// Event interface
interface Event {
    _id: string;
    title: string;
    startDateTime: string;
    endDateTime: string;
    recurrenceRule?: { interval: number };
    repeatType?: string;
    isRecurring: boolean;
    userId: string;
    participants: { _id: string }[];
}

interface EventSeries {
    _id: string;
    name: string;
    creatorId: string;
    recurrenceRule?: {
        frequency: string;
        interval?: number;
        endDate?: string;
    };
    seriesType: string;
    isIndefinite: boolean;
    startingEvent: {
        title: string;
        description: string;
        startDateTime: string;
        startTime: { hour: number; minute: number };
        endTime: { hour: number; minute: number };
    };
    endingEvent: {
        title: string;
        description: string;
        startDateTime: string;
        startTime: { hour: number; minute: number };
        endTime: { hour: number; minute: number };
    };
    eventsId: string[];
    createdAt: string;
    updatedAt: string;
}

const allViews: View[] = ['month', 'week', 'work_week', 'day', 'agenda'];

function Calendar() {
    const [events, setEvents] = useState<Event[]>([]);
    const [seriesEvents, setSeriesEvents] = useState<Event[]>([]);
    const [calendarView, setCalendarView] = useState<View>('month');
    const [isYearView, setIsYearView] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const generateRepeatedEvents = (event: Event) => {
        const repeatDays = event.recurrenceRule?.interval || 1; // Default to 1 if interval is undefined
        const repeatType = event.repeatType || 'daily';
        const baseDate = event.startDateTime ? parseISO(event.startDateTime) : null;
    
        if (!baseDate) {
            console.error('Invalid start date:', event.startDateTime);
            return [];
        }
    
        const repeatedEvents: Event[] = [];
    
        for (let i = 0; i < repeatDays; i++) {
            const newDate = new Date(baseDate);
    
            if (repeatType === 'daily') {
                newDate.setDate(baseDate.getDate() + i);
            } else if (repeatType === 'weekly') {
                newDate.setDate(baseDate.getDate() + i * 7);
            } else if (repeatType === 'monthly') {
                newDate.setMonth(baseDate.getMonth() + i);
            }
    
            repeatedEvents.push({
                ...event,
                startDateTime: newDate.toISOString(),
                endDateTime: new Date(newDate.getTime() + (parseISO(event.endDateTime).getTime() - baseDate.getTime())).toISOString(),
                isRecurring: i > 0,
            });
        }
    
        return repeatedEvents;
    };

    const fetchEvents = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = user?._id;

        try {
            const response = await fetch(`${key}/api/events`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const data: Event[] = await response.json();
    

            const filteredEvents = data.filter(
                (event) =>
                    event.userId === currentUserId || event.participants?.some((p) => p._id === currentUserId)
            );

            const allEvents: Event[] = [];
            filteredEvents.forEach((event) => {
                if (event.isRecurring) {
                    allEvents.push(...generateRepeatedEvents(event));
                } else {
                    allEvents.push({
                        ...event,
                        startDateTime: parseISO(event.startDateTime).toISOString(),
                        endDateTime: parseISO(event.endDateTime).toISOString(),
                    });
                }
            });


            setEvents(allEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchEventSeries = async () => {
        const user = JSON.parse(localStorage.getItem("user") || '{}');
        const currentUserId = user?._id;

        try {
            const response = await fetch(`${key}/api/events/event-series`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch event series");

            const data: EventSeries[] = await response.json();

            const filteredSeries = data.filter(
                (series) => series.creatorId === currentUserId
            );

            const seriesEventInstances: Event[] = [];

            filteredSeries.forEach((series) => {
                const startDate = series.startingEvent?.startDateTime ? parseISO(series.startingEvent.startDateTime) : null;
                const endDate = series.endingEvent?.startDateTime ? parseISO(series.endingEvent.startDateTime) : null;

                if (!startDate || !endDate) {
                    console.error('Invalid date in event series:', series);
                    return;
                }

                const recurrenceRule = series.recurrenceRule 
                ? { interval: series.recurrenceRule.interval ?? 1 } 
                : undefined;
        

                const repeatedSeries = generateRepeatedEvents({
                    _id: series._id,
                    title: series.name,
                    isRecurring: true,
                    userId: currentUserId,
                    participants: [],
                    startDateTime: startDate.toISOString(),
                    endDateTime: endDate.toISOString(),
                    recurrenceRule: recurrenceRule, 
                });
            
                seriesEventInstances.push(...repeatedSeries);
            });

            setSeriesEvents(seriesEventInstances);

        } catch (error) {
            console.error("Error fetching event series:", error);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchEventSeries();
    }, [currentDate, calendarView]); // Added calendarView and currentDate dependencies

    const handlePrevYear = () => setCurrentYear((y) => y - 1);
    const handleNextYear = () => setCurrentYear((y) => y + 1);

    const changeView = (view: View | 'year') => {
        if (view === 'year') {
            setIsYearView(true);
            setCurrentYear(new Date().getFullYear());
        } else {
            setIsYearView(false);
            setCalendarView(view);
        }
    };

    const handleNavigate = (date: Date, view: View) => {
        setCurrentDate(date);
        setCalendarView(view);
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
                        allViews.map((v) => (
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
                            <button className={style.prevYear} onClick={handlePrevYear}>
                                ←
                            </button>
                            <h2 className={style.year} style={{ margin: 0 }}>
                                {currentYear}
                            </h2>
                            <button className={style.nextYear} onClick={handleNextYear}>
                                →
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ height: '75vh' }}>
                {isYearView ? (
                    <div style={{ width: '100%', height: '100%', padding: '10px', boxSizing: 'border-box' }}>
                        <YearCalendar year={currentYear} />
                    </div>
                ) : (
                    <BigCalendar
                        localizer={localizer}
                        events={[...events, ...seriesEvents]}
                        startAccessor={(event: Event) => new Date(event.startDateTime)}
                        endAccessor={(event: Event) => new Date(event.endDateTime)}
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
