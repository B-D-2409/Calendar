import style from './Calendar.module.css';
function Calendar () {
    return (
        <div className={style.calendar}>
        <h1>Calendar</h1>
        <p>This is the calendar component.</p>
        {/* Additional calendar functionality can be added here */}
        </div>
    )
}

export default Calendar;