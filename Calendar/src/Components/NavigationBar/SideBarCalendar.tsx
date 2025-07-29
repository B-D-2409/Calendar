import { useTheme } from "../ThemeProvider/ThemeProvider";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./SideBarCalendar.css";

/**
 * SidebarCalendar component displays a month-view calendar
 * styled according to the current theme (dark or light).
 * 
 * It uses the `react-calendar` package and applies conditional
 * CSS classes based on the theme.
 * 
 * @component
 * return The themed calendar component for the sidebar.
 */
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
