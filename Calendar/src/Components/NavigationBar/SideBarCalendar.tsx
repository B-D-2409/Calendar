import { useTheme } from "../ThemeProvider/ThemeProvider";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./SidebarCalendar.css";

const SidebarCalendar = () => {
  const { theme } = useTheme();

  return (
    <div className="sidebar-calendar-container">
      <Calendar
        className={theme === "dark" ? "react-calendar dark-theme" : "react-calendar"}
        defaultActiveStartDate={new Date()}
        view="month"
        maxDetail="month"
        minDetail="month"
        showNeighboringMonth={false}
        showNavigation={true}
      />
    </div>
  );
};

export default SidebarCalendar;
