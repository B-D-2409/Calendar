import { useState, useEffect, useMemo, useContext } from "react";
import styles from './Home.module.css';
import axios from "axios";
import { useLocation } from "react-router-dom";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";
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
    date?: string;
    time?: string;
    [key: string]: any;
}

interface User {
    username: string;
    _id: string;
}

function HomePage() {
    const [publicEvents, setPublicEvents] = useState<Event[]>([]);
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [searchResults, setSearchResults] = useState<Event[] | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const { user, isLoggedIn } = useContext(AuthContext) as AuthContextType;
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isInviteVisible, setIsInviteVisible] = useState<string | null>(null);
    const [selectedUsername, setSelectedUsername] = useState("");
    const [feedback, setFeedback] = useState("");

    const eventsPerPage = 6;

    const location = useLocation();
    const token = localStorage.getItem("token");
    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleJoinEvent = async (event: Event) => {
        if (!user || !user._id) {
            toast.error("Please log in to join this event.");
            return;
        }

        if (event.participants.includes(user._id)) {
            toast.error("You are already a participant in this event.");
            return;
        }

        setIsJoining(true);
        try {
            const response = await axios.post(
                `${key}/api/events/${event._id}/join`,
                null,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedParticipants = response.data.participants;
            const updatedEvent = { ...event, participants: updatedParticipants };

            // Update participatingEvents with new event data
            setParticipatingEvents(prev => [...prev, updatedEvent]);

            toast.success("Successfully joined the event!");
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("Failed to join event.");
            }
        } finally {
            setIsJoining(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await axios.get(`${key}/api/auth/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching contacts:", err);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);
    const handleSendInvite = async (eventId: string) => {
        try {
            if (!selectedUsername) return;

            await axios.post(`${key}/api/events/invite/${eventId}`, { username: selectedUsername }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setFeedback(`Invite sent to ${selectedUsername}!`);
            setSelectedUsername("");
            setSearchTerm("");
            setIsInviteVisible(null);
            toast.success("Invite sent!");
        } catch (error) {
            toast.error("Failed to send invite");
        }
    };



    const handleLeaveEvent = async (event: Event) => {
        if (!user || !user._id) {
            toast.error("Please log in to leave this event.");
            return;
        }

        setIsLeaving(true);
        try {
            await axios.delete(`${key}/api/events/${event._id}/leave`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setParticipatingEvents(prev => prev.filter(e => e._id !== event._id));

            toast.success("Successfully left the event!");
        } catch (error) {
            toast.error("Failed to leave event.");
        } finally {
            setIsLeaving(false);
        }
    };

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

    const handleDeleteEvent = async (event: Event) => {
        if (!event._id) return;
        try {
            await axios.delete(`${key}/api/events/${event._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setMyEvents((prev) => prev.filter((e) => e._id !== event._id));
            toast.success("Event successfully deleted");
        } catch (err) {
            toast.error("Failed to delete event");
        }
    };



    useEffect(() => {
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

            // Fetch participating events
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

    const uniqueEvents = useMemo(() => {
        const allEventsMap = new Map<string, Event>();
        [...publicEvents, ...myEvents, ...participatingEvents].forEach(event => {
            if (event && event._id) {
                allEventsMap.set(event._id, event);
            }
        });
        return Array.from(allEventsMap.values());
    }, [publicEvents, myEvents, participatingEvents]);

    const allEvents = searchResults !== null ? searchResults : uniqueEvents;
    const totalPages = Math.ceil(allEvents.length / eventsPerPage);
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const eventsToDisplay = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);

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
                        <h2>{searchResults !== null ? `Search Results for "${searchTerm}"` : "All Events"}</h2>
                        {searchResults !== null && (
                            <button onClick={clearSearch} className={styles.clearSearchButton}>Clear Search</button>
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
                                <div className={styles.eventsList}>
                                    {eventsToDisplay.map(event => {
                                        const typeColor = event.type === "public" ? "green" : "red";

                                        return (
                                            <div key={event._id} className={styles.eventCard}>
                                                <h3>{event.title}</h3>
                                                <p>{event.description}</p>

                                                <Link
                                                    to={`/eventdetailspage/${event._id}`}
                                                    className={styles.eventDetailLink}
                                                >
                                                    See Details
                                                </Link>

                                                {event.type === "public" ? (
                                                    <button
                                                        onClick={() => handleJoinEvent(event)}
                                                        disabled={isJoining}
                                                        className={styles.joinButton}
                                                    >
                                                        Join
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setIsInviteVisible(isInviteVisible === event._id ? null : event._id)}
                                                            className={styles.inviteButton}
                                                        >
                                                            {isInviteVisible === event._id ? "Cancel Invite" : "Invite"}
                                                        </button>

                                                        {isInviteVisible === event._id && (
                                                            <div className={styles.inviteContainer}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search users..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                    className={styles.searchInput}
                                                                />

                                                                <select
                                                                    value={selectedUsername}
                                                                    onChange={(e) => setSelectedUsername(e.target.value)}
                                                                    className={styles.selectUser}
                                                                >
                                                                    <option value="" disabled>Select a user</option>
                                                                    {users
                                                                        .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
                                                                        .map(user => (
                                                                            <option key={user.username} value={user.username}>
                                                                                {user.username}
                                                                            </option>
                                                                        ))}
                                                                </select>

                                                                <button
                                                                    onClick={() => handleSendInvite(event._id)}
                                                                    disabled={!selectedUsername}
                                                                    className={styles.sendInviteButton}
                                                                >
                                                                    Send Invite
                                                                </button>

                                                                {feedback && <p className={styles.feedbackText}>{feedback}</p>}
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => handleLeaveEvent(event)}
                                                    disabled={isLeaving}
                                                    className={styles.inviteButton}
                                                >
                                                    Leave
                                                </button>
                                                <span style={{
                                                    color: typeColor, fontWeight: "bold", position: "absolute",    
                                                    top: "15px",           
                                                    left: "270px"
                                                }}>
                                                    {event.type.toUpperCase()}
                                                </span>

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
                            ) : (
                                <p className={styles.noEventsText}>No events found.</p>
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

            <ToastContainer />
        </div>
    );


}

export default HomePage;
