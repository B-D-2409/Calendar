import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { MdArrowForwardIos, MdArrowBackIosNew, MdInfoOutline } from "react-icons/md";
import { IconContext } from "react-icons";
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";
type EventType = {
    id?: string;          // some events may have `id`
    _id?: string;         // some events may have `_id`
    description: string;
    // add other properties you expect from event here, e.g.:
    title: string;
    date: string;
    // ...
};

interface CustomSpinnerProps {
    color?: string;
    size?: string; // e.g. "48px" or "3rem"
    animationDuration?: string; // e.g. "1s"
    borderWidth?: string; // e.g. "5px"
    padding?: string;
    margin?: string;
}


export const CustomSpinner: React.FC<CustomSpinnerProps> = ({
    color = "#5565DD",
    size = "48px",
    animationDuration = "1s",
    borderWidth = "5px",
    padding,
    margin,
}) => {
    const style = {
        display: "inline-block",
        width: size,
        height: size,
        border: `${borderWidth} solid rgba(85, 101, 221, 0.2)`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: `spin ${animationDuration} linear infinite`,
        padding,
        margin,
    };

    return <span style={style} />;
};

const PublicPage = () => {
    const [publicEvents, setPublicEvents] = useState<EventType[]>([]);
    const [searchResults, setSearchResults] = useState<EventType[] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const eventsPerPage = 6;
    const location = useLocation();

    useEffect(() => {
        if (location.state?.searchResults && location.state?.searchTerm) {
            setSearchResults(location.state.searchResults);
            setSearchTerm(location.state.searchTerm);
            setCurrentPage(1);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const handleGlobalSearch = (event: any) => {
            const { results, term } = event.detail;
            setSearchResults(results);
            setSearchTerm(term);
            setCurrentPage(1);
        };

        const handleGlobalClearSearch = () => {
            setSearchResults(null);
            setSearchTerm("");
            setCurrentPage(1);
        };

        window.addEventListener("homepageSearch", handleGlobalSearch);
        window.addEventListener("homepageClearSearch", handleGlobalClearSearch);

        return () => {
            window.removeEventListener("homepageSearch", handleGlobalSearch);
            window.removeEventListener("homepageClearSearch", handleGlobalClearSearch);
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        const fetchPublicEvents = async () => {
            try {
                
                const response = await fetch(`${key}/api/events/public`);
                if (!response.ok) {
                    throw new Error("Failed to fetch public events");
                }
                const data = await response.json();
                
                setPublicEvents(data);
            } catch (error) {
                console.error("Error fetching public events:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPublicEvents();
    }, []);

    const eventsToProcess = searchResults !== null ? searchResults : publicEvents;
    const totalPages = Math.ceil(eventsToProcess.length / eventsPerPage);
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = eventsToProcess.slice(indexOfFirstEvent, indexOfLastEvent);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const clearSearch = () => {
        setSearchResults(null);
        setSearchTerm("");
        setCurrentPage(1);
        window.dispatchEvent(new CustomEvent("clearNavSearch"));
    };

    return (
        <>
            {/* Welcome Text Section */}
            <div style={{
                maxWidth: "700px",
                margin: "20px auto",
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "#f9f9f9",
                textAlign: "center",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}>
                <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome to Imera Calendarium!</h2>
                <hr style={{ marginBottom: "1rem" }} />
                <p style={{ fontSize: "1.1rem", lineHeight: "1.5" }}>
                    We've noticed that you're currently an Anonymous user.<br />
                    Non-registered users can only view or search for Public Events.<br />
                    If you want to fully experience our Imera Calendar,<br />
                    <Link to="/authentication" style={{ color: "#5565DD", fontWeight: "bold", textDecoration: "underline" }}>
                        Log in or Register here!
                    </Link>
                </p>
            </div>

            {/* Public Events Section */}
            <div style={{
                maxWidth: "1400px",
                margin: "40px auto",
                padding: "0 20px",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}>
                <h2 style={{
                    fontSize: "1.8rem",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center"
                }}>
                    {searchResults !== null ? `Search Results for "${searchTerm}"` : "Public Events"}
                    {searchResults !== null && (
                        <button
                            onClick={clearSearch}
                            style={{
                                marginLeft: "1rem",
                                background: "#DC2626",
                                color: "white",
                                border: "none",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "1rem",
                                height: "fit-content",
                            }}
                        >
                            Clear Search
                        </button>
                    )}
                </h2>

                <IconContext.Provider value={{ size: "2.5em" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px 20px",
                        }}
                    >
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

                        <div style={{ flex: 1, minHeight: "300px" }}>
                            {loading ? (
                                <CustomSpinner />
                            ) : currentEvents.length > 0 ? (
                                <>
                                    {/* Replace CardsListComponent with your own cards implementation or placeholder */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                            gap: "20px",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {currentEvents.map((event) => (
                                            <div
                                                key={event.id || event._id}
                                                style={{
                                                    border: "1px solid #ccc",
                                                    borderRadius: "8px",
                                                    padding: "15px",
                                                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                                    backgroundColor: "white",
                                                }}
                                            >
                                                <h3 style={{ marginTop: 0 }}>{event.title}</h3>
                                                <p>{event.description}</p>
                                                {/* Add more event details as needed */}
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        textAlign: "center",
                                        marginTop: "20px",
                                        fontSize: "1rem",
                                        color: "#666"
                                    }}>
                                        Page {currentPage} of {totalPages || 1}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "50px 0", color: "#666" }}>
                                    {searchResults !== null
                                        ? `No events found matching "${searchTerm}"`
                                        : "No public events available"}
                                </div>
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
            </div>

            {/* About Page Button */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                margin: "40px 0 60px 0",
            }}>
                <Link
                    to="/about"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        backgroundColor: "#5565DD",
                        color: "white",
                        padding: "25px 40px",
                        borderRadius: "9999px",
                        fontSize: "18px",
                        fontWeight: "600",
                        textDecoration: "none",
                        boxShadow: "0 4px 6px rgba(85, 101, 221, 0.3)",
                        transition: "background-color 0.3s",
                        cursor: "pointer",
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4455CC"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#5565DD"}
                >
                    <MdInfoOutline style={{ marginRight: "8px" }} /> Learn More About Imera Calendarium
                </Link>
            </div>
        </>
    );
};

export default PublicPage;
