import style from '../SideBar/SideBar.module.css';
import NavigationBar from "../NavigationBar/NavigationBar";

/**
 * Header component that wraps the NavigationBar inside a styled container.
 * 
 * @component
 * @example
 * return (
 *   <Header />
 * )
 * 
 * @returns {JSX.Element} The header section with navigation bar.
 */
function Header() {
    return (
        <div className={style.header}>
            <NavigationBar />
        </div>
    );
}

export default Header;
