import React from 'react';

import style from '../SideBar/SideBar.module.css';
import NavigationBar from "../NavigationBar/NavigationBar";
function Header() {
 
    return (
        <div className={style.header}>
            <NavigationBar />
        </div>
        

        

    )

}


export default Header;