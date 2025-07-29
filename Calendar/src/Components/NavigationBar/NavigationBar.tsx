import { useState, useContext, useRef, useEffect } from "react";
import { useTheme } from "../ThemeProvider/ThemeProvider";
import SidebarCalendar from "./SideBarCalendar";
import style from "./NavigationBar.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import "./SideBarCalendar.css";
import { AuthContext } from "../../Common/AuthContext";
import { AuthContextType } from "../../Common/AuthContext";
import Searchbar from "../SearchBar/SearchBar";

/**
 * NavigationBar component handles the main navigation UI, including:
 * - Sidebar toggling
 * - Theme switching
 * - Search bar display and dismissal
 * - User dropdown menu with logout functionality
 * 
 * It listens for outside clicks to close search and dropdown menus.
 *
 * @component
 * @example
 * return (
 *   <NavigationBar />
 * )
 *
 * return The navigation bar element.
 */
function NavigationBar() {
    const [sideBarOpen, setSideBarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const { isLoggedIn, user, logout } = useContext(AuthContext) as AuthContextType;
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    /**
    * Toggles the visibility of the search bar.
    */
    const toggleSearch = () => setShowSearch(prev => !prev);
    /**
        * Toggles the sidebar open/closed state.
        */
    const toggleSideBar = () => {
        setSideBarOpen(!sideBarOpen);
    };

    // Effect to close the search bar when clicking outside
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

    // Effect to close the user dropdown when clicking outside
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

    /**
        * Logs out the current user, closes the dropdown, and navigates to authentication page.
        */
    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        navigate('/authentication');
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
                        <nav className={style.nav}>
                            <NavLink
                                to="/calendar"
                                className={({ isActive }) =>
                                    isActive ? `${style.navLink} ${style.active}` : style.navLink
                                }
                            >
                                Calendar
                            </NavLink>
                        </nav>
                    ) : null}

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

                </div>

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
                    <button className={style.closeSidebar} onClick={toggleSideBar}></button>
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
                        to="/notifications"
                        className={({ isActive }) =>
                            isActive ? `${style.navLink} ${style.active}` : style.navLink
                        }
                    >
                        Notifications
                    </NavLink>

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
                        My Event Series
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
