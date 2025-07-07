import style from './AboutPage.module.css';
function AboutPage() {
    return (
        <div className={style.aboutPage}>
        <h1>About Us</h1>
        <p>Welcome to our application! We are dedicated to providing the best user experience.</p>
        <p>Our team is committed to continuous improvement and innovation.</p>
        <p>Thank you for being a part of our journey!</p>
        </div>
    );
}

export default AboutPage;