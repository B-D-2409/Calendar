
import style from './Year.module.css';

type Props = {
     /** The year to render in the calendar. Defaults to current year if not provided. */
    year?: number;
};


/**
 * Displays a grid of 12 months for the specified year.
 *
 * @component
 * @param {Props} props - Component props
 * @param {number} [props.year] - Optional year to render; defaults to current year
 * @returns {JSX.Element} A grid of month calendars
 */
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
      /** Date object representing the month and year to render */
    monthDate: Date;
};


/**
 * Displays a single month calendar including padding for the first day of the month.
 *
 * @component
 * @param {MonthProps} props - Component props
 * @param {Date} props.monthDate - Date object representing the month to render
 * @returns {JSX.Element} A rendered month grid
 */
const MonthCalendar: React.FC<MonthProps> = ({ monthDate }) => {
    const today = new Date();
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const monthName = monthDate.toLocaleString('default', { month: 'long' });


  /** Number of days in the month */
    const daysInMonth = new Date(year, month + 1, 0).getDate();

     /** Index of the first day in the week (0 = Sunday, 6 = Saturday) */
    const firstDay = new Date(year, month, 1).getDay();


  /** Array representing day slots to render in the calendar */
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
