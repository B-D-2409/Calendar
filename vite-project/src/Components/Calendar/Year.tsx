import React from 'react';
import style from './Year.module.css';

type Props = {
    year?: number;
};

const YearCalendar: React.FC<Props> = ({ year = new Date().getFullYear() }) => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    return (
        <div className={style.yearGrid}>
            {months.map((monthDate) => (
                <MonthCalendar key={monthDate.getMonth()} monthDate={monthDate} />
            ))}
        </div>
    );
};

type MonthProps = {
    monthDate: Date;
};

const MonthCalendar: React.FC<MonthProps> = ({ monthDate }) => {
    const today = new Date();
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const monthName = monthDate.toLocaleString('default', { month: 'long' });


    const daysInMonth = new Date(year, month + 1, 0).getDate();

    
    const firstDay = new Date(year, month, 1).getDay();


    const daysArray = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
        i < firstDay ? null : i - firstDay + 1
    );

    return (
        <div className={style.month}>
            <h4>{monthName}</h4>
            <div className={style.daysGrid}>
            
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className={style.dayName}>
                        {d}
                    </div>
                ))}
            
                {daysArray.map((day, idx) => {
                    const isToday =
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();

                    return (
                        <div
                            key={idx}
                            className={`${style.day} ${isToday ? style.today : ''}`}
                            title={day ? `${day} ${monthName} ${year}` : ''}
                        >
                            {day ?? ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default YearCalendar;
