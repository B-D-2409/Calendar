import { useState } from "react";
import { useTheme } from "../ThemeProvider/ThemeProvider";
import SidebarCalendar from "./SideBarCalendar";
import style from "./NavigationBar.module.css";
import { NavLink } from "react-router-dom";
import "./SidebarCalendar.css";
function NavigationBar() {
    const [sideBarOpen, setSideBarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const toggleSideBar = () => {
        setSideBarOpen(!sideBarOpen);
    };

    return (
        <>
            <div className={style.header}>
                <button className={style.sidebarButton} onClick={toggleSideBar}>
                    ☰
                </button>

                <div className={style.navContainer}>
                    <nav className={style.nav}>
                        <NavLink
                            to="/homepage"
                            className={({ isActive }) =>
                                isActive ? `${style.navLink} ${style.active}` : style.navLink
                            }
                        >
                            Home
                        </NavLink>
                    </nav>

                    <nav className={style.calendar}>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                isActive ? `${style.navLink} ${style.active}` : style.navLink
                            }
                        >
                            Calendar
                        </NavLink>
                    </nav>
                </div>

                <div className={style.admin}
                >
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        Admin
                    </NavLink>

                </div>

                <header className={style.headerRight}>
                    <button className={style.mode} onClick={toggleTheme}>
                        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>
                    <NavLink to="/authentication" className={style.userButton}>
                        👤 Account
                    </NavLink>

                </header>
            </div>

            {sideBarOpen && (
                <aside className={style.sidebar}>
                    <button className={style.closeSidebar} onClick={toggleSideBar}>
                        ×
                    </button>
                    <SidebarCalendar />
                    <NavLink
                        to="/contact"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        Contact
                    </NavLink>
                    <NavLink
                        to="/ProfileInfo"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        Profile
                    </NavLink>
                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        About
                    </NavLink>
                </aside>
            )}
        </>
    );
}

export default NavigationBar;
