import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./Contacts.module.css";
import { ToastContainer, toast } from "react-toastify";
import CreateContactsListForm from "../../ContactListFrom/ContactListForm";

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";
const DEFAULT_AVATAR =
    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";

interface Contact {
    _id: string;
    username: string;
    avatar?: string;
}

interface Event {
    _id: string;
    name: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
}
function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchedUsers, setSearchedUsers] = useState<Contact[]>([]);
    const { user, token } = useContext(AuthContext) as AuthContextType;
    const [currentView, setCurrentView] = useState<string>("");
    const [contactLists, setContactLists] = useState<any[]>([]);
    const [blured, setBlured] = useState<boolean>(false);
    const [isInviting, setIsInviting] = useState<boolean>(false);
    const [events, setEvents] = useState<Event[]>([]);
    const invitePopupRef = useRef<HTMLDivElement | null>(null);
    const [feedback, setFeedback] = useState<string>("");
    const [selectedUsername, setSelectedUsername] = useState<string>("");
    const [error, setError] = useState<string>("");

    // Fetch on mount
    useEffect(() => {
        fetchAllUsers();
        fetchAllContactsList();
        fetchEvents();
    }, []); // <-- empty array ensures runs only once

    // Fetch user's events
    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${key}/api/events/mine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("Failed to load your events");
        }
    };

    // Send invitation to event participant
    const handleSendInvite = async () => {
        if (!selectedUsername.trim()) {
            setFeedback("Please enter a username");
            return;
        }
        const selectedEvent = events.find((e) => e.name === currentView);
        if (!selectedEvent || !selectedEvent._id) {
            setFeedback("No Event selected");
            return;
        }

        try {
            const response = await axios.post(
                `${key}/api/events/${selectedEvent._id}/participants`,
                { username: selectedUsername.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFeedback(response.data.message || `Invite sent to ${selectedUsername}!`);
            toast.success(`Invite sent to ${selectedUsername}`);
            setSelectedUsername("");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const msg = error.response?.data?.message || "Failed to send invite";
                setFeedback(msg);
                toast.error(msg);
            } else {
                console.error("An unexpected error occurred:", error);
                toast.error("An unexpected error occurred");
            }
        }
    };

    // Fetch all users for contacts list
    const fetchAllUsers = async () => {
        try {
            const response = await axios.get(`${key}/api/auth/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(response.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error("Error fetching contacts:", err.response?.data || err);
            } else {
                console.error("An unexpected error occurred:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch contact lists (your own groups etc)
    const fetchAllContactsList = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${key}/api/contacts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContactLists(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error fetching contacts list:", error.response?.data || error.message);
                setContactLists([]);
            } else {
                console.error("An unexpected error occurred:", error);
            }
        } finally {
            setLoading(false);
        }
    };
    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchedUsers([]);
            return;
        }

        try {
            const res = await axios.get(`${key}/api/auth/users/search/${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSearchedUsers(res.data.data || []);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(error);
                setError(error.response?.data?.message || "Failed to search users.");
            } else {
                setError("An unexpected error occurred.");
            }
            setSearchedUsers([]);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <p>Loading contacts...</p>
            </div>
        );
    }
    const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;  // safer check
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };


    return (
        <div className={`${styles.contactsContainer} ${blured ? styles.blured : ""}`}>
            <button onClick={() => setIsInviting(true)} className={styles.inviteButton}>
                Invite to Event
            </button>

            {isInviting && (
                <div className={styles.inviteOverlay}>
                    <div
                        ref={invitePopupRef}
                        className={styles.invitePopup}
                        style={{
                            position: "fixed",
                            zIndex: 1000,
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            width: "500px",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            padding: "20px",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
                            <h2 style={{ marginBottom: "16px", fontWeight: 700 }}>Invite to Event</h2>
                            <h3 style={{ color: "grey", marginBottom: "20px" }}>Click on an Event to select</h3>
                        </div>

                        {events.length === 0 && <p>No events found.</p>}

                        {events.map((e) => (
                            <div
                                key={e._id}
                                onClick={() => setCurrentView(e.name)}
                                className={`${styles.eventItem} ${currentView === e.name ? styles.selectedEvent : ""}`}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    padding: "12px 16px",
                                    marginBottom: "12px",
                                    cursor: "pointer",
                                }}
                            >
                                <h3 style={{ margin: "0 0 6px" }}>{e.name}</h3>
                                <p style={{ margin: "0 0 6px", color: "#666" }}>{e.description}</p>
                                <p style={{ margin: "0 0 4px", fontSize: "14px" }}>
                                    <strong>{`Start: ${formatDate(e.startDateTime)}`}</strong>
                                </p>
                                <p style={{ margin: 0, fontSize: "14px" }}>
                                    <strong>{`End: ${formatDate(e.endDateTime)}`}</strong>
                                </p>
                            </div>
                        ))}

                        {currentView && (
                            <div className={styles.eventDetails}>
                                <h4>Selected Event: {currentView}</h4>
                                <input
                                    type="text"
                                    placeholder="Enter username"
                                    value={selectedUsername}
                                    onChange={(e) => setSelectedUsername(e.target.value)}
                                />
                                <button onClick={handleSendInvite}>Send Invite</button>
                                {feedback && <p>{feedback}</p>}
                            </div>
                        )}

                        <button
                            className={styles.closeButton}
                            onClick={() => {
                                setIsInviting(false);
                                setCurrentView("");
                                setFeedback("");
                                setSelectedUsername("");
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.search}>
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                />
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>

            <div className={styles.contactsList}>
                {contacts.length === 0 ? (
                    <p>No contacts found</p>
                ) : (
                    <ul>
                        {(searchedUsers.length > 0 ? searchedUsers : contacts).map((contact) => (
                            <li key={contact._id}>
                                <img
                                    src={contact.avatar || DEFAULT_AVATAR}
                                    alt={contact.username}
                                    className={styles.avatar}
                                />
                                <span>{contact.username}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <CreateContactsListForm onListCreated={fetchAllContactsList} />
            <ToastContainer />
        </div>
    );

}

export default Contacts;
