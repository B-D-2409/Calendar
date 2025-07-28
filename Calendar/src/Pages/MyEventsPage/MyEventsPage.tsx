import React, { useEffect, useState } from "react";
import EventForm from "../../Components/Events/EventForm";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import style from "./MyEventsPage.module.css";
import { CustomSpinner } from "../PublicPage/PublicPage";
import { Link } from "react-router-dom";

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

// Combined RecurrenceRule interface
interface RecurrenceRule {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Allow `undefined`
    interval?: number;
    endDate?: Date | string;
}

interface Event {
    title: string;
    description: string;
    type: 'public' | 'private'; // Type of event (public or private)
    participants: string[];
    creatorName?: string;
    startDateTime: string;
    endDateTime: string;
    isRecurring: boolean;
    isLocation: boolean;
    location: Location;
    recurrenceRule?: RecurrenceRule;
    _id: string;
    isSeries?: boolean;
}

interface EventTime {
    hour: number;
    minute: number;
}

interface Location {
    address: string;
    city: string;
    country: string;
}

interface EventTemplate {
    title: string;
    description: string;
    startDateTime: Date;
    startTime: EventTime;
    endTime: EventTime;
    location?: Location;
}

interface EventSeries {
    _id: string;
    name: string;
    creatorId: string; // User ID referencing the creator of the event series
    seriesType: 'recurring' | 'manual'; // Type of series: recurring or manual
    isIndefinite: boolean; // Whether the event series has no end date
    startingEvent: EventTemplate; // The first event in the series
    endingEvent?: EventTemplate; // The last event in the series (only if the series isn't indefinite)
    recurrenceRule?: RecurrenceRule; // Optional, only present if the series is recurring
    eventsId: string[]; // List of event IDs (references to Event model)
    createdAt?: string; // Timestamp for when the series was created (optional)
    updatedAt?: string; // Timestamp for when the series was last updated (optional)
}

interface User {
    username: string;
    _id: string;
}

function MyEventsPage() {
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"myEvents" | "participating">("myEvents");
    const [isInviteVisible, setIsInviteVisible] = useState<string | null>(null);
    const [selectedUsername, setSelectedUsername] = useState("");
    const [feedback, setFeedback] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [seriesOfEvents, setSeriesOfEvents] = useState<EventSeries[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const myResponse = await fetch(`${key}/api/events/mine`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                if (!myResponse.ok) {
                    throw new Error("Failed to fetch my events");
                }

                const myData = await myResponse.json();
                setMyEvents(myData);

                const participatingResponse = await fetch(
                    `${key}/api/events/participants`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                if (!participatingResponse.ok) {
                    throw new Error("Failed to fetch participating events");
                }

                const participatingData = await participatingResponse.json();
                const markedParticipatingData = participatingData.map((event: any) => ({
                    ...event,
                    isUserParticipant: true,
                }));
                setParticipatingEvents(markedParticipatingData);
            } catch (error) {
                console.error("Error fetching events:", error);
                toast.error("Failed to load events");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);
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


    const handleJoinEvent = async (event: Event) => {
        const token = localStorage.getItem("token");
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
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Get updated participants from backend response
            const updatedParticipants = response.data.participants;

            // Update local event state with new participants list
            const updatedEvent = {
                ...event,
                participants: updatedParticipants,
            };

            setParticipatingEvents((prev) => [...prev, updatedEvent]);

            toast.success("Successfully joined the event!");
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("Failed to join event.");
            }
        } finally {
            setIsJoining(false);
        }
    };




    const handleLeaveEvent = async (event: Event) => {
        const token = localStorage.getItem("token");
        if (!user || !user._id) {
            toast.error("Please log in to leave this event.");
            return;
        }

        setIsLeaving(true);
        try {
            await axios.delete(`${key}/api/events/${event._id}/leave`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setParticipatingEvents((prev) =>
                prev.filter((e) => e._id !== event._id)
            );
            toast.success("Successfully left the event!");
        } catch (error) {
            toast.error("Failed to leave event.");
        } finally {
            setIsLeaving(false);
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
            toast.success("Event successfully deleted");
        } catch (err) {
            toast.error("Failed to delete event");
        }
    };

    useEffect(() => {
        const fetchSeriesEvents = async () => {
            try {
                const response = await axios.get(`${key}/api/events/event-series`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setSeriesOfEvents(response.data);
            } catch (error) {
                console.error("Error fetching series events:", error);
                toast.error("Failed to load series events");
            }
        };

        fetchSeriesEvents();
    }, []); // Empty dependency array ensures thi

    return (
        <>
            <div
                className={`${style.myeventsContainerWithTabs} ${showCreateForm ? style.blurred : ""}`}
            >
                <h1 className={style.myeventsTitleH1}>Manage & Create Your Events</h1>

                <div className={style.myeventsBoxContainerTabs}>
                    <div className={style.tabsRoot}>
                        <div className={style.tabsList}>
                            <button
                                className={`${style.tabTrigger} ${activeTab === "myEvents" ? style.activeTab : ""}`}
                                onClick={() => setActiveTab("myEvents")}
                                type="button"
                            >
                                My Events
                            </button>

                            <button
                                onClick={() => setShowCreateForm(true)}
                                className={style.createEventButton}
                                type="button"
                            >
                                Create Event
                            </button>

                            <button
                                className={`${style.tabTrigger} ${activeTab === "participating" ? style.activeTab : ""}`}
                                onClick={() => setActiveTab("participating")}
                                type="button"
                            >
                                Participating
                            </button>
                        </div>

                        <div className={style.tabsContent}>
                            {activeTab === "myEvents" && (
                                <>
                                    {isLoading ? (
                                        <CustomSpinner />
                                    ) : myEvents.length > 0 ? (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                                            {myEvents.map((event) => (
                                                <div key={event._id || event.title} className={style.eventCard}>
                                                    <h2>{event.title}</h2>
                                                    <p>{event.description}</p>
                                                    <p>{new Date(event.startDateTime).toLocaleString()}</p>

                                                    <p className={style.eventType} style={{ color: event.type === "public" ? "green" : "red" }}>
                                                        {event.type === "public" ? "Public" : "Private"}
                                                    </p>


                                                    <Link
                                                        to={`/eventdetailspage/${event._id}`}
                                                        className={style.eventDetailLink}
                                                    >
                                                        See Details
                                                    </Link>

                                                    <button
                                                        onClick={() => handleDeleteEvent(event)}
                                                        className={style.deleteButton}
                                                    >
                                                        Delete
                                                    </button>

                                                    {event.type === "public" ? (
                                                        <button
                                                            onClick={() => handleJoinEvent(event)}
                                                            className={style.joinButton}
                                                            disabled={isJoining}
                                                        >
                                                            {isJoining ? "Joining..." : "Join Event"}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    setIsInviteVisible(
                                                                        isInviteVisible === event._id ? null : event._id
                                                                    )
                                                                }
                                                                className={style.inviteButton}
                                                            >
                                                                Invite to Event
                                                            </button>
                                                            {isInviteVisible === event._id && (
                                                                <div className={style.inviteSection}>
                                                                    <input
                                                                        type="text"
                                                                        value={searchTerm}
                                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                                        placeholder="Search by username"
                                                                        className={style.searchInput}
                                                                    />

                                                                    {/* Dropdown select for usernames filtered by searchTerm */}
                                                                    <select
                                                                        value={selectedUsername}
                                                                        onChange={(e) => {
                                                                            setSelectedUsername(e.target.value);
                                                                            setFeedback(""); // if you have feedback state
                                                                        }}
                                                                        className={style.usernameSelect}
                                                                    >
                                                                        <option value="" disabled>
                                                                            Select username
                                                                        </option>
                                                                        {users
                                                                            .filter((u) =>
                                                                                u.username
                                                                                    .toLowerCase()
                                                                                    .includes(searchTerm.toLowerCase())
                                                                            )
                                                                            .map((u) => (
                                                                                <option key={u._id} value={u.username}>
                                                                                    {u.username}
                                                                                </option>
                                                                            ))}
                                                                    </select>

                                                                    <button
                                                                        onClick={() => handleSendInvite(event._id!)}
                                                                        disabled={!selectedUsername}
                                                                        className={style.sendInviteButton}
                                                                    >
                                                                        Send Invite
                                                                    </button>

                                                                    {feedback && <p className={style.feedbackText}>{feedback}</p>}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>You haven't created any events yet.</p>
                                    )}
                                </>
                            )}

                            {activeTab === "participating" && (
                                <>
                                    {isLoading ? (
                                        <CustomSpinner />
                                    ) : participatingEvents.length > 0 ? (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                                            {participatingEvents.map((event) => (
                                                <div key={event._id || event.title} className={style.eventCard}>
                                                    <h2>{event.title}</h2>
                                                    <p>{event.description}</p>
                                                    <p>{new Date(event.startDateTime).toLocaleString()}</p>

                                                    <Link
                                                        to={`/eventdetailspage/${event._id}`}
                                                        className={style.eventDetailLink}
                                                    >
                                                        See Details
                                                    </Link>

                                                    <button
                                                        onClick={() => handleLeaveEvent(event)}
                                                        className={style.leaveButton}
                                                    >
                                                        {isLeaving ? "Leaving..." : "Leave Event"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>You are not participating in any events.</p>
                                    )}
                                </>
                            )}

                            {/* Displaying series events with split structure */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                                {seriesOfEvents.length > 0 ? (
                                    seriesOfEvents.map((series) => (
                                        <div key={series._id} className={style.eventCard}>
                                            <h2>{series.name} (Series)</h2>
                                            <p>Type: {series.seriesType}</p>
                                            <p>
                                                Start: {new Date(series.startingEvent.startDateTime).toLocaleString()}
                                            </p>
                                            <p>
                                                End: {series.isIndefinite
                                                    ? 'Ongoing'
                                                    : series.endingEvent?.startDateTime
                                                        ? new Date(series.endingEvent.startDateTime).toLocaleString()
                                                        : 'End date not available'}
                                            </p>

                                            <div className={style.eventDetails}>
                                                <h3>Starting Event</h3>
                                                <p>{series.startingEvent.title}</p>
                                                <p>{series.startingEvent.description}</p>

                                                <h3>Ending Event</h3>
                                                <p>{series.endingEvent ? series.endingEvent.title : 'No ending event (Indefinite series)'}</p>
                                                <p>{series.endingEvent ? series.endingEvent.description : 'This event is ongoing.'}</p>
                                            </div>

                                            {/* Recurrence Information */}
                                            <p>
                                                Recurrence: {series.recurrenceRule?.frequency} {series.recurrenceRule?.frequency === 'monthly' && '(Monthly)'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No series of events available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateForm && (
                <div className={style.eventFormBackdrop}>
                    <div className={style.eventFormContainer}>
                        <EventForm setShowCreateForm={setShowCreateForm} />
                    </div>
                </div>
            )}

            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </>
    );

}

export default MyEventsPage;
