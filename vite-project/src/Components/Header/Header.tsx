

import style from '../SideBar/SideBar.module.css';
import SideBar from "../SideBar/SideBar";

function Header() {
 
    return (
        <div className={style.header}>
            <SideBar />
            
        </div>

    )

}


export default Header;