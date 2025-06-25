import { useState } from "react";
import { useTheme } from "../ThemeProvider/ThemeProvider";

import style from "./SideBar.module.css";
import { NavLink } from "react-router-dom";

function SideBar() {
    const [sideBarOpen, setSideBarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();


    const toggleSideBar = () => {
        setSideBarOpen(!sideBarOpen);
    }
    return (
        <>
            <div className={style.header}>
                <button className={style.sidebarButton} onClick={toggleSideBar}>
                    ☰
                </button>

                <nav className={`${style.nav}`}>
                    <NavLink to="/" className={({ isActive }) => isActive ? `${style.navLink} ${style.active}` : style.navLink}
                    >Home</NavLink>
                </nav>

                <header>
                    <button className={style.mode} onClick={toggleTheme}>
                        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>
                </header>
            </div>

            {sideBarOpen && (
                <aside className={style.sidebar}>
                    <button className={style.closeSidebar} onClick={toggleSideBar}>×</button>
                    <NavLink to="/contact" className={({ isActive }) => isActive ? `${style.navLink} ${style.active}` : style.navLink}
                    >Contact</NavLink>
                    <NavLink to='/ProfileInfo' className={({ isActive }) => isActive ? `${style.navLink} ${style.active}` : style.navLink}
                    >Profile</NavLink>
                    <NavLink to="/about" className={({ isActive }) => isActive ? `${style.navLink} ${style.active}` : style.navLink}
                    >About</NavLink>
                </aside>
            )}
        </>
    );
};

export default SideBar;