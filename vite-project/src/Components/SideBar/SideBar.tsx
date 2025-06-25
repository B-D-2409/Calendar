import { useState } from "react";
import style from "./SideBar.module.css";
import { NavLink } from "react-router-dom";

function SideBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [sideBarOpen, setSideBarOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const toggleSideBar = () => {
        setSideBarOpen(!sideBarOpen);
    }
    return (
        <>
            <div className={style.header}>
                <button className={style.sidebarButton} onClick={toggleSideBar}>
                    ☰
                </button>

                <nav className={`${style.nav} ${isOpen ? style.open : ""}`}>
                    <NavLink to="/">Home</NavLink>
                </nav>

                <button className={style.menuButton} onClick={toggleMenu}>
                    {isOpen ? "Close" : "Menu"}
                </button>
            </div>

            {sideBarOpen && (
                <aside className={style.sidebar}>
                    <button className={style.closeSidebar} onClick={toggleSideBar}>×</button>
                    <NavLink to="/contact" onClick={toggleSideBar}>Contact</NavLink>
                    <NavLink to='/ProfileInfo' onClick={toggleSideBar}>Profile</NavLink>
                    <NavLink to="/about" onClick={toggleSideBar}>About</NavLink>
                </aside>
            )}
        </>
    );
};

export default SideBar;