import style from './Home.module.css';
function HomePage() {
    return (
        <div className={style.homePage}>
        <h1>Welcome to the Home Page</h1>
        <p>This is the main content area of the home page.</p>
        </div>
    );
}

export default HomePage;