import { useState, useEffect, useMemo, useContext } from "react";
import styles from './Home.module.css';
import axios from "axios";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";
/**
 * Interface representing an event.
 * @typedef {Object} Event
 * @property {string} _id - Unique event ID.
 * @property {string} title - Event title.
 * @property {string} [coverPhoto] - Optional URL of event cover photo.
 * @property {string} [startDateTime] - Optional ISO start datetime.
 * @property {string} [startDate] - Optional start date.
 * @property {string} [endDateTime] - Optional ISO end datetime.
 * @property {string} [endDate] - Optional end date.
 * @property {string} [start] - Computed start date/time string.
 * @property {string} [end] - Computed end date/time string.
 * @property {any} [location] - Optional event location details.
 * @property {string} [description] - Optional event description.
 * @property {string[]} participants - Array of participant user IDs.
 * @property {string|Object} [userId] - Owner user ID (string or object with toString method).
 * @property {string} [date] - Optional event date.
 * @property {string} [time] - Optional event time.
 * @property {any} [key] - Additional dynamic properties.
 */
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

/**
 * Interface representing a user.
 * @typedef {Object} User
 * @property {string} username - User's username.
 * @property {string} _id - User's unique ID.
 */
interface User {
    username: string;
    _id: string;
}
/**
 * HomePage component shows public events, user's events, and events user participates in.
 * Supports searching, pagination, joining/leaving events, inviting users, and deleting events.
 *
 * @component
 * returns {JSX.Element} The rendered HomePage component.
 */
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


    const token = localStorage.getItem("token");

    /**
     * Moves to previous page if not on first page.
     */
    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    /**
     * Moves to next page if not on last page.
     */
    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };


    /**
     * Attempts to join the specified event for the current logged-in user.
     * Shows toast notifications on success or failure.
     *
     * @param {Event} event - The event to join.
     * returns {Promise<void>}
     */
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

    /**
 * Fetches all users from backend API to allow sending invitations.
 *
 * returns {Promise<void>}
 */
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

    // Load all users once on component mount
    useEffect(() => {
        fetchAllUsers();
    }, []);

    /**
 * Sends an invite to a user to join an event.
 *
 * @param {string} eventId - ID of the event to invite user to.
 * @returns {Promise<void>}
 */
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


    /**
     * Allows current user to leave a participating event.
     *
     * @param {Event} event - The event to leave.
     * @returns {Promise<void>}
     */
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

    /**
 * Listens for global custom events for search and clear search,
 * updating search results and term accordingly.
 */
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

    /**
 * Deletes an event created by the logged-in user.
 *
 * @param {Event} event - The event to delete.
 * @returns {Promise<void>}
 */
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




    /**
     * Fetches all events: public, user's own, and participating events on mount.
     * Sets state accordingly. Handles errors gracefully.
     */
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

            <ToastContainer position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark" />
        </div>
    );


}

export default HomePage;
