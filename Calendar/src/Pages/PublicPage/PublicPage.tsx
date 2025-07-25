import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { MdArrowForwardIos, MdArrowBackIosNew, MdInfoOutline } from "react-icons/md";
import { IconContext } from "react-icons";

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

type EventType = {
    id?: string;
    _id?: string;
    description: string;
    title: string;
    date: string;
    type: string;
};

export const CustomSpinner = ({
    color = "#5565DD",
    size = "48px",
    animationDuration = "1s",
    borderWidth = "5px",
}) => {
    const style = {
        display: "inline-block",
        width: size,
        height: size,
        border: `${borderWidth} solid rgba(85, 101, 221, 0.2)`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: `spin ${animationDuration} linear infinite`,
    };
    return <span style={style} />;
};

const PublicPage = () => {
    const [publicEvents, setPublicEvents] = useState<EventType[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const eventsPerPage = 6;

    const location = useLocation();

    useEffect(() => {
        setLoading(true);
        fetch(`${key}/api/events/public`)
            .then((res) => res.json())
            .then((data) => {
                setPublicEvents(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch public events:", err);
                setLoading(false);
            });
    }, []);

    const totalPages = Math.ceil(publicEvents.length / eventsPerPage);
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = publicEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    return (
        <>
            {/* Welcome Section */}
            <div className="homePageContainer">
                <div style={{
                    maxWidth: "700px",
                    margin: "20px auto",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                }}>
                    <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome to Organize Me Calendar!</h2>
                    <p style={{ fontSize: "1.1rem", lineHeight: "1.5" }}>
                        You are currently browsing as an Anonymous user.<br />
                        To join events and organize your calendar,<br />
                        please
                        <Link
                            to="/authentication"
                            className="gradient-button"
                            style={{
                                fontWeight: "bold",
                                textDecoration: "underline",
                                marginLeft: "5px",
                                transition: "color 0.3s",
                                background: "linear-gradient(90deg, lightgreen 20%, coral 80%)",
                                color: "black",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.filter = "brightness(1.1)";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.filter = "brightness(1)";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            Log in or Register here
                        </Link>
                    </p>
                </div>
            </div>
    
            {/* Events Section */}
            <div className="homePageContainer">
                <div className="publicEventsBox" style={{ padding: "20px" }}>
                    <h2 style={{ fontSize: "1.8rem", marginBottom: "20px", textAlign: "center" }}>Public Events</h2>
    
                    <IconContext.Provider value={{ size: "2.5em" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div
                                onClick={handlePrevPage}
                                style={{
                                    cursor: currentPage > 1 ? "pointer" : "not-allowed",
                                    opacity: currentPage > 1 ? 1 : 0.3,
                                    userSelect: "none",
                                    padding: "10px",
                                }}
                                aria-label="Previous page"
                                role="button"
                            >
                                <MdArrowBackIosNew />
                            </div>
    
                            <div style={{ flex: 1 }}>
                                {loading ? (
                                    <CustomSpinner />
                                ) : currentEvents.length > 0 ? (
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                                        gap: "20px",
                                    }}>
                                        {currentEvents.map((event) => {
                                            const typeColor = event.type === "public" ? "green" : "red";
                                            return (
                                                <div
                                                    key={event.id || event._id}
                                                    style={{
                                                        position: "relative",
                                                        border: "1px solid #e0e0e0",
                                                        borderRadius: "10px",
                                                        padding: "15px",
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "space-between",
                                                    }}
                                                >
                                                    <span style={{
                                                        color: typeColor,
                                                        fontWeight: "bold",
                                                        position: "absolute",
                                                        top: "15px",
                                                        left: "15px",
                                                    }}>
                                                        {event.type.toUpperCase()}
                                                    </span>
    
                                                    <div>
                                                        <h3 style={{
                                                            fontSize: "1.2rem",
                                                            marginBottom: "10px"
                                                        }}>{event.title}</h3>
                                                        <p style={{ fontSize: "0.95rem" }}>{event.description}</p>
                                                    </div>
                                                    <Link
                                                        to="/authentication"
                                                        className="gradient-button"
                                                        style={{
                                                            marginTop: "15px",
                                                            display: "inline-block",
                                                            color: "black",
                                                            textAlign: "center",
                                                            padding: "10px",
                                                            borderRadius: "5px",
                                                            textDecoration: "none",
                                                            fontWeight: "500",
                                                            transition: "background-color 0.3s",
                                                            background: "linear-gradient(90deg, lightgreen 20%, coral 80%)",
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.filter = "brightness(1.1)";
                                                            e.currentTarget.style.transform = "scale(1.05)";
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.filter = "brightness(1)";
                                                            e.currentTarget.style.transform = "scale(1)";
                                                        }}
                                                    >
                                                        Join
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: "center" }}>No public events available</p>
                                )}
                            </div>
    
                            <div
                                onClick={handleNextPage}
                                style={{
                                    cursor: currentPage < totalPages ? "pointer" : "not-allowed",
                                    opacity: currentPage < totalPages ? 1 : 0.3,
                                    userSelect: "none",
                                    padding: "10px",
                                }}
                                aria-label="Next page"
                                role="button"
                            >
                                <MdArrowForwardIos />
                            </div>
                        </div>
                    </IconContext.Provider>
    
                    {/* Pagination Info */}
                    <div style={{ textAlign: "center", marginTop: "20px", fontSize: "1rem" }}>
                        Page {currentPage} of {totalPages || 1}
                    </div>
                </div>
            </div>
    
            {/* About Page Button */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                margin: "40px 0 60px 0",
            }}>
                <Link
                    to="/about"
                    className="gradient-button about-button"
                    style={{
                        color: "black",
                        fontWeight: "600",
                        textDecoration: "none",
                        cursor: "pointer",
                        background: "linear-gradient(90deg, lightgreen 20%, coral 80%)",
                        fontSize: "1.2rem",
                        padding: "15px 30px",
                        borderRadius: "10px",
                        boxShadow: "0 6px 10px rgba(85, 101, 221, 0.3)",
                        transition: "background-color 0.3s, transform 0.2s",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.filter = "brightness(1.1)";
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.filter = "brightness(1)";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    <MdInfoOutline style={{ marginRight: "8px" }} /> Learn More About Organize Me Calendar
                </Link>
            </div>
        </>
    );
    


};

export default PublicPage;
