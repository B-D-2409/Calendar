import React, { useEffect, useState, useContext, useRef } from "react";
import axios, { AxiosError } from "axios"; // AxiosError type import
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./Contacts.module.css"; // Importing CSS Module
import { ToastContainer, toast } from "react-toastify";
import CreateContactsListForm from "../../ContactListFrom/ContactListForm";
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";
const DEFAULT_AVATAR =
    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";

// Defining the Contact interface
interface Contact {
    _id: string;
    username: string;
    avatar?: string;
    // Add other properties as necessary (e.g., email, etc.)
}

function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<Contact[]>([]); // Specify type for contacts
    const [loading, setLoading] = useState<boolean>(true); // Specify type for loading
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchedUsers, setSearchedUsers] = useState<Contact[]>([]); // Specify type for searched users
    const { user, token } = useContext(AuthContext) as AuthContextType;
    const [currentView, setCurrentView] = useState<string>("");
    const [contactLists, setContactLists] = useState<any[]>([]); // Specify type for contactLists
    const [blured, setBlured] = useState<boolean>(false); // Specify type for blured
    const [isInviting, setIsInviting] = useState<boolean>(false); // Specify type for isInviting
    const [events, setEvents] = useState<any[]>([]); // Specify type for events
    const invitePopupRef = useRef<HTMLDivElement | null>(null); // Specify type for ref
    const [feedback, setFeedback] = useState<string>(""); // Specify type for feedback
    const [selectedUsername, setSelectedUsername] = useState<string>("");
    const [error, setError] = useState<string>("");

    const fetchEvents = async () => {
        try {
            const response = await fetch(`${key}/api/events/mine`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch events");
            }
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    fetchEvents();


    const handleSendInvite = async (event: any) => {
        if (!selectedUsername) {
            setFeedback("Please select a username");
            return;
        }
        if (!event._id) {
            setFeedback("No ID found");
            return;
        }

        try {
            const response = await axios.post(
                `${key}/api/events/${event._id}/participants`,
                { username: selectedUsername },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setFeedback(
                response.data.message || `Invite sent to ${selectedUsername}!`
            );
            toast.success(`Invite sent to ${selectedUsername}`);
            setSelectedUsername("");
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const msg = error.response?.data?.message || "Failed to send invite";
                setFeedback(msg);
                toast.error("User already participating in this event");
            } else {
                console.error("An unexpected error occurred:", error);
            }
        }
    };

    useEffect(() => {
        fetchAllUsers();
        fetchAllContactsList();
        fetchEvents();
    }, []);


    const fetchAllUsers = async () => {
        try {
            const response = await axios.get(`${key}/api/auth/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(response.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                console.error("Error fetching contacts:", err.response?.data || err);
            } else {
                console.error("An unexpected error occurred:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAllContactsList = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${key}/api/contacts`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setContactLists(response.data);
        } catch (error: unknown) {
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

    const handleDeleteList = async (id: string) => {
        try {
            const res = await fetch(`${key}/api/contacts/delete/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (res.ok) {
                setContactLists((prevLists) => prevLists.filter((list) => list._id !== id));
                toast.success(`Contact list deleted successfully`);
            } else {
                const errorData = await res.json();
                toast.error(`Failed to delete: ${errorData.message}`);
            }
        } catch (error: any) {
            console.log(`Error: ${error.message}`);
        }
    };

    const handleContactListCreated = () => {
        fetchAllContactsList();
    };


    const handleRemoveFromList = async (listId: string, userId: string) => {
        try {
            const res = await axios.delete(
                `${key}/api/contacts/${listId}/contacts/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Contact removed.");

            setContactLists((prevLists) =>
                prevLists.map((list) => {
                    if (list._id === listId) {
                        return {
                            ...list,
                            contacts: list.contacts.filter((contact: Contact) => contact._id !== userId),
                        };
                    }
                    return list;
                })
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to create list.");
            } else {
                toast.error("Failed to remove contact.");
                setError("An unexpected error occurred.");
            }
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchedUsers([]); // Reset result view
            return;
        }

        try {
            const res = await axios.get(
                `${key}/api/auth/users/search/${searchQuery}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const matchedUsers = res.data.data || [];
            setSearchedUsers(matchedUsers);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to create list.");
            } else {
                setError("An unexpected error occurred.");
            }
            setSearchedUsers([]);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <p>Loading contacts...</p>
            </div>
        );
    }

    return (
        <div className={`${styles.contactsContainer} ${blured ? styles.blured : ""}`}>
            {isInviting && (
                <div className={styles.inviteForm}>
                    <div ref={invitePopupRef} className={styles.popup}>
                        <div className={styles.popupContent}>
                            <h2>Invite to Event</h2>
                            <h3>Click on the Event to Invite</h3>
                            {events.map((e, index) => (
                                <div
                                    className={styles.event}
                                    key={index}
                                    onClick={() => setCurrentView(e.name)}
                                >
                                    {e.name}
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
                        </div>
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
                        handleSearch();
                    }}
                />
            </div>

            <div className={styles.contactsList}>
                {contacts.length === 0 ? (
                    <p>No contacts found</p>
                ) : (
                    <ul>
                        {contacts.map((contact) => (
                            <li key={contact._id}>
                                <img
                                    src={contact.avatar || DEFAULT_AVATAR}
                                    alt={contact.username}
                                    className={styles.avatar}
                                />
                                <span>{contact.username}</span>
                                <button
                                    onClick={() => handleRemoveFromList(contact._id, user!._id)}
                                >
                                    Remove from list
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <CreateContactsListForm onListCreated={handleContactListCreated} />
            <ToastContainer />
        </div>
    );
}

export default Contacts;
