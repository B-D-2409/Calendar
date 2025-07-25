import { useState, useContext, useRef, useEffect } from "react";
import { useTheme } from "../ThemeProvider/ThemeProvider";
import SidebarCalendar from "./SideBarCalendar";
import style from "./NavigationBar.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import "./SideBarCalendar.css";
import { AuthContext } from "../../Common/AuthContext";
import { AuthContextType } from "../../Common/AuthContext";
import Searchbar from "../SearchBar/SearchBar";

interface EventData {
    _id: string;
    title: string;
    coverPhoto?: string;
    startDateTime?: string;
    startDate?: string;
    endDateTime?: string;
    endDate?: string;
    start?: string;
    end?: string;
    location?: Location;
    description?: string;
    participants: string[];
    type?: string;
    userId?: string | { toString(): string };
    [key: string]: any;
}

function NavigationBar() {
    const [sideBarOpen, setSideBarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const { isLoggedIn, user, logout } = useContext(AuthContext) as AuthContextType;
    const navigate = useNavigate();

    // Добавяме тази референция, за да можем да засичаме кликове извън менюто
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const toggleSearch = () => setShowSearch(prev => !prev);

    const toggleSideBar = () => {
        setSideBarOpen(!sideBarOpen);
    };

    // Затваряне на Searchbar, ако кликнеш извън него
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearch(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Затваряне на dropdown-а при клик извън него
    useEffect(() => {
        const handleClickOutsideDropdown = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutsideDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
        };
    }, []);

    // Функция за logout
    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        navigate('/authentication'); // или където искаш да препратиш след logout
    };

    return (
        <>
            <div className={style.header}>
                <button className={style.sidebarButton} onClick={toggleSideBar}>
                    ☰
                </button>

                <div ref={searchRef} className={style.searchContainer}>
                    {showSearch ? (
                        <Searchbar />
                    ) : (
                        <button onClick={toggleSearch} className={style.bigSearchButton}>
                            🔍 Search
                        </button>
                    )}
                </div>
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

                    {isLoggedIn ? (
                        <nav className={style.calendar}>
                            <NavLink
                                to="/calendar"
                                className={({ isActive }) =>
                                    isActive ? `${style.navLink} ${style.active}` : style.navLink
                                }
                            >
                                Calendar
                            </NavLink>
                        </nav>
                    ) : (
                        <nav className={style.nav}>
                            <NavLink
                                to="/publicpage"
                                className={({ isActive }) =>
                                    isActive ? `${style.navLink} ${style.active}` : style.navLink
                                }
                            >
                            </NavLink>
                        </nav>
                    )}
                </div>

                {isLoggedIn && user?.role === "admin" && (
                    <div className={style.admin}>
                        <NavLink
                            to="/admin"
                            className={({ isActive }) =>
                                isActive ? `${style.navLink} ${style.active}` : style.navLink
                            }
                        >
                            Admin
                        </NavLink>
                    </div>
                )}

                <header className={style.headerRight}>
                    <button className={style.mode} onClick={toggleTheme}>
                        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>

                    {isLoggedIn ? (
                        <div className={style.dropdown} ref={dropdownRef}>
                            <button
                                className={style.userButton}
                                onClick={() => setDropdownOpen((open) => !open)}
                            >
                                👤 Account
                            </button>

                            {dropdownOpen && (
                                <div className={style.dropdownMenu}>
                                    <div className={style.dropdownItem}>
                                        Hello, {user?.username || 'User'}
                                    </div>
                                    <button
                                        className={style.dropdownItem}
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NavLink to="/authentication" className={style.userButton}>
                            👤 Account
                        </NavLink>
                    )}
                </header>
            </div>

            {sideBarOpen && (
                <aside className={style.sidebar}>
                    <button className={style.closeSidebar} onClick={toggleSideBar}>
                    </button>
                    <NavLink
                        to="/events"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active} ${style.createButton}` : `${style.navLink} ${style.createButton}`
                        }
                    >
                        +CREATE
                    </NavLink>

                    <SidebarCalendar />
                    <NavLink
                        to="/myeventpage"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        My Events
                    </NavLink>

                    <NavLink
                        to="/seriesofevents"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        Series Of Events
                    </NavLink>
                    <NavLink
                        to="/contact"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        Contact
                    </NavLink>
                    <NavLink
                        to="/profilepage"
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
