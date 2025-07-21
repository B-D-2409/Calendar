import { useState, useEffect, useMemo } from "react";
import styles from './Home.module.css';
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
    location?: any;
    description?: string;
    participants: string[];
    userId?: string | { toString(): string };
    date?: string; // Added for display fallback
    time?: string; // Added for display fallback
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

    const location = useLocation();

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleDeleteEvent = async (event: Event) => {
        if (!event._id) return;
        try {
            await axios.delete(`${key}/api/events/${event._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setMyEvents(prev => prev.filter(e => e._id !== event._id));

            if (searchResults) {
                setSearchResults(prev => (prev ? prev.filter(e => e._id !== event._id) : prev));
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
            .then(res => res.json())
            .then(data => Array.isArray(data) ? setPublicEvents(data) : setPublicEvents([]))
            .catch(err => {
                setPublicEvents([]);
                console.error("Failed to fetch public events:", err);
            });

        if (token) {
            const authHeaders = { Authorization: `Bearer ${token}` };

            fetch(`${key}/api/events`, { headers: authHeaders })
            .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch my events"))
            .then(data => Array.isArray(data) ? setMyEvents(data) : setMyEvents([]))
            .catch(err => {
                setMyEvents([]);
                console.error(err);
            });
            // Fetch events where user is a participant
            fetch(`${key}/api/events/participants`, { headers: authHeaders })
                .then(res => {
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
                    return res.ok ? res.json() : Promise.resolve([]);
                })
                .then(data => {
                    setParticipatingEvents(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error("Participating events fetch error:", err);
                    setParticipatingEvents([]);
                });
        } else {
            setMyEvents([]);
            setParticipatingEvents([]);
        }
    }, []);

    // Combine events uniquely by _id
    const uniqueEvents = useMemo(() => {
        const allEventsMap = new Map<string, Event>();
        [...publicEvents, ...myEvents, ...participatingEvents].forEach(event => {
            if (event && event._id) {
                allEventsMap.set(event._id, event);
            }
        });
        return Array.from(allEventsMap.values());
    }, [publicEvents, myEvents, participatingEvents]);

    // Decide which events to show (search results or all unique)
    const allEvents = searchResults !== null ? searchResults : uniqueEvents;

    // Pagination calculations
    const totalPages = Math.ceil(allEvents.length / eventsPerPage);
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const eventsToDisplay = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    const displayTitle = searchResults !== null
        ? `Search Results for "${searchTerm}"`
        : "All Events";

    const clearSearch = () => {
        setSearchResults(null);
        setSearchTerm("");
        setCurrentPage(1);
        window.dispatchEvent(new CustomEvent('clearNavSearch'));
    };

    return (
        <div className={styles.homePageContainer}>
            <h1 className={styles.headingWelcome}>Events</h1>
            <p className={styles.headingWelcomeSecond}>Discover and manage events effortlessly</p>

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
                            aria-disabled={currentPage <= 1}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') handlePrevPage(); }}
                        >
                            &#8592;
                        </div>

                        <div className={styles.eventsContent}>
                            {eventsToDisplay.length > 0 ? (
                                <>
                                    <div className={styles.eventsList}>
                                        {eventsToDisplay.map(event => {
                                            const dateToShow = event.startDateTime || event.start || event.date;
                                            const timeToShow = event.startDateTime ? new Date(event.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : event.time || "";

                                            return (
                                                <div key={event._id} className={styles.eventCard}>
                                                    <h3>{event.title}</h3>
                                                    <p>{event.description}</p>
                                                    <p>{dateToShow ? new Date(dateToShow).toLocaleDateString() : "No date"} {timeToShow}</p>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event)}
                                                        className={styles.deleteButton}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            );
                                        })}
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
                            aria-disabled={currentPage >= totalPages}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') handleNextPage(); }}
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
