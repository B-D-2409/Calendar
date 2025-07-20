import { useState, useEffect, useMemo } from "react";
import styles from './Home.module.css'
import axios from "axios";
import { useLocation } from "react-router-dom";


const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface Event {
    _id: string;
    title: string;
    coverPhoto?: string;
    startDateTime?: string;
    startDate?: string;
    endDateTime?: string;
    endDate?: string;
    start?: string;
    end?: string;
    location?: Location;
    description?: string;
    participants: string[];
    userId?: string | { toString(): string };
    [key: string]: any;
}
function HomePage() {
    const [publicEvents, setPublicEvents] = useState<Event[]>([]);
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [searchResults, setSearchResults] = useState<Event[] | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const eventsPerPage = 6;

    const location = useLocation()


    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };


    const handleDeleteEvent = async (event: Event) => {
        if (!event._id) return;
        try {
            await axios.delete(`${key}/api/events/${event._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setMyEvents((prev) => prev.filter((e) => e._id !== event._id));

            if (searchResults) {
                setSearchResults((prev) => {
                    if (!prev) return prev;
                    return prev.filter((e) => e._id !== event._id);
                });
            }
        } catch (err) {
            alert("Failed to delete event");
            console.error(err);
        }
    };

    useEffect(() => {
        if (location.state?.searchResults && location.state?.searchTerm) {
            setSearchResults(location.state.searchResults);
            setSearchTerm(location.state.searchTerm);
            // Clear the navigation state to prevent re-triggering
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Listen for search events from NavComponent
    useEffect(() => {
        const handleGlobalSearch = (event: any) => {
            const { results, term } = event.detail;
            setSearchResults(results);
            setSearchTerm(term);
        };

        const handleGlobalClearSearch = () => {
            setSearchResults(null);
            setSearchTerm("");
        };

        window.addEventListener('homepageSearch', handleGlobalSearch);
        window.addEventListener('homepageClearSearch', handleGlobalClearSearch);

        return () => {
            window.removeEventListener('homepageSearch', handleGlobalSearch);
            window.removeEventListener('homepageClearSearch', handleGlobalClearSearch);
        };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        // Fetch all public events
        fetch(`${key}/api/events/public`)
            .then((res) => res.json())
            .then((data) => Array.isArray(data) ? setPublicEvents(data) : setPublicEvents([]))
            .catch((err) => {
                setPublicEvents([]);
                console.error("Failed to fetch public events:", err);
            });

        if (token) {
            const authHeaders = { Authorization: `Bearer ${token}` };

            // Fetch events created by the user
            fetch(`${key}/api/events`, { headers: authHeaders })
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => Array.isArray(data) ? setMyEvents(data) : setMyEvents([]))
                .catch((err) => {
                    setMyEvents([]);
                    console.error("Failed to fetch my events:", err);
                });

            // Fetch events where user is a participant
            fetch(`${key}/api/events/participating`, { headers: authHeaders })
                .then((res) => {
                    if (res.status === 500) {
                        return res.json().then(errorData => {
                            console.error("500 Error details:", errorData);
                            setParticipatingEvents([]);
                            return [];
                        }).catch(() => {
                            setParticipatingEvents([]);
                            return [];
                        });
                    }

                    if (res.status === 403) {
                        setParticipatingEvents([]);
                        return [];
                    }
                    return res.ok ? res.json() : [];
                })
                .then((data) => {
                    Array.isArray(data)
                        ? setParticipatingEvents(data)
                        : setParticipatingEvents([]);
                })
                .catch((err) => {
                    console.error("Participating events fetch error:", err);
                    setParticipatingEvents([]);
                });
        } else {
            setMyEvents([]);
            setParticipatingEvents([]);
        }

    }, []);


    // Iterate through all events to remove "duplicated" events
    const uniqueEvents = useMemo(() => {
        const allEventsMap = new Map();
        [...publicEvents, ...myEvents, ...participatingEvents].forEach((event) => {
            if (event && event._id) {
                allEventsMap.set(event._id, event);
            }
        });
        return Array.from(allEventsMap.values());
    }, [publicEvents, myEvents, participatingEvents]);


    // Display events pagination
    const allEvents = searchResults !== null ? searchResults : uniqueEvents;

    // Calculate total pages
    const totalPages = Math.ceil(allEvents.length / eventsPerPage);

    // Get current events for display
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const eventsToDisplay = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    // Display 'search results' or 'all events'
    // const eventsToDisplay = searchResults !== null ? searchResults : uniqueEvents;
    const displayTitle = searchResults !== null
        ? `Search Results for "${searchTerm}"`
        : "All Events";

    const clearSearch = () => {
        setSearchResults(null);
        setSearchTerm("");
        setCurrentPage(1); // Reset to fist page
        // Also clear the search in NavComponent
        window.dispatchEvent(new CustomEvent('clearNavSearch'));
    };



    return (
        <div className={styles.homePageContainer}>
            <h1 className={styles.headingWelcome}>
                Events
            </h1>

            <p className={styles.headingWelcomeSecond}>
                Discover and manage events effortlessly
            </p>

            <div className={styles.publicEventsContainer}>
                <div className={styles.publicEventsBox}>
                    <div className={styles.headingAllEventsSearchResult}>
                        <h2>{displayTitle}</h2>
                        {searchResults !== null && (
                            <button
                                onClick={clearSearch}
                                className={styles.clearSearchButton}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>

                    <div className={styles.arrowsCardlistContainer}>
                        <div
                            onClick={handlePrevPage}
                            className={`${styles.arrowButton} ${currentPage <= 1 ? styles.disabledArrow : ""}`}
                        >
                            &#8592;
                        </div>

                        <div className={styles.eventsContent}>
                            {eventsToDisplay.length > 0 ? (
                                <>
                                    <div className={styles.eventsList}>
                                        {eventsToDisplay.map((event) => (
                                            <div key={event._id} className={styles.eventCard}>
                                                <h3>{event.title}</h3>
                                                <p>{event.description}</p>
                                                <p>
                                                    {new Date(event.date).toLocaleDateString()} {event.time}
                                                </p>
                                                <button
                                                    onClick={() => handleDeleteEvent(event)}
                                                    className={styles.deleteButton}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.paginationInfo}>
                                        Page {currentPage} of {totalPages || 1}
                                    </div>
                                </>
                            ) : (
                                <p className={styles.noEventsText}>
                                    {searchResults !== null
                                        ? `No events found for "${searchTerm}"`
                                        : "No events available"}
                                </p>
                            )}
                        </div>

                        <div
                            onClick={handleNextPage}
                            className={`${styles.arrowButton} ${currentPage >= totalPages ? styles.disabledArrow : ""}`}
                        >
                            &#8594;
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
