import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import styles from "./Contacts.module.css";
import { CreateContactsListForm } from "../../ContactListFrom/CreateContactListForm";
import { AxiosError } from 'axios';

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";
const DEFAULT_AVATAR =
    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";


/**
* Represents a single contact.
* @typedef {Object} Contact
* @property {string} _id - Unique identifier for the contact.
* @property {string} username - Username of the contact.
* @property {string} [avatar] - Optional avatar image URL for the contact.
*/
interface Contact {
    _id: string;
    username: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
}


/**
 * Represents an event owned or accessible by the user.
 * @typedef {Object} Event
 * @property {string} _id - Unique identifier for the event.
 * @property {string} name - Event name.
 * @property {string} [description] - Optional description of the event.
 * @property {string} [startDateTime] - Optional ISO string of start date/time.
 * @property {string} [endDateTime] - Optional ISO string of end date/time.
 */
interface Event {
    _id: string;
    name: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
}

/**
 * Represents the structure of an error response from the API.
 * @typedef {Object} ApiErrorResponse
 * @property {string} message - The error message returned by the API.
 */
interface ApiErrorResponse {
    message: string;

}


/**
 * Contacts Component
 *
 * Displays the user's contacts and events.
 * Allows inviting contacts to events, managing contact lists,
 * and provides feedback on operations via toast notifications.
 *
 * @component
 * returns {JSX.Element} The Contacts page UI.
 */
function Contacts() {
    const { user, token } = useContext(AuthContext) as AuthContextType;

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isInviting, setIsInviting] = useState<boolean>(false);
    const [selectedUsername, setSelectedUsername] = useState<string>("");
    const [currentEventId, setCurrentEventId] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [contactLists, setContactLists] = useState<any[]>([]);



    useEffect(() => {
        fetchAllUsers();
        fetchEvents();
        fetchContactLists();
    }, []);


    /**
     * Fetch all users (contacts) from the API.
     * Updates contacts state or logs error on failure.
     */
    const fetchAllUsers = async () => {
        try {
            const response = await axios.get(`${key}/api/auth/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(response.data);
        } catch (err) {
            console.error("Error fetching contacts:", err);
        } finally {
            setLoading(false);
        }
    };


    /**
     * Fetch events that belong to the logged-in user.
     * Shows toast notification on failure.
     */
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

    /**
        * Send an invite to a user for the selected event.
        * Validates input and shows success/error feedback.
        */
    const handleSendInvite = async () => {
        if (!selectedUsername.trim()) {
            setFeedback("Please enter a username");
            return;
        }

        if (!currentEventId) {
            setFeedback("Please select an event");
            return;
        }

        setLoading(true);
        setIsInviting(true);

        try {
            const response = await axios.post(
                `${key}/api/events/invite/${currentEventId}`,
                { username: selectedUsername },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setFeedback(`Invite sent to ${selectedUsername}`);
            toast.success("Invite sent!");
            setSelectedUsername("");
            setIsInviting(false);
            setLoading(false);

        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;

            console.error("Error from API:", axiosError.response?.data);

            if (axiosError.response?.data?.message === "Event creator is missing, cannot invite participants") {
                setFeedback("Cannot send invite: The event has no creator.");
            } else {
                setFeedback("Failed to send invite");
            }

            setIsInviting(false);
            setLoading(false);
        }
    };

    /**
        * Fetch the user's contact lists.
        * Shows toast notification on failure.
        */
    const fetchContactLists = async () => {
        try {
            const response = await axios.get(`${key}/api/contacts/lists`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContactLists(response.data);
        } catch (err) {
            console.error("Error fetching contact lists:", err);
            toast.error("Failed to load your contact lists");
        }
    };
    /**
  * Delete a contact from a list or delete the entire list.
  * @param {string} listId - The ID of the contact list.
  * @param {string} [contactId] - The ID of the contact to remove (optional).
  */
    const handleDeleteContactFromList = async (listId: string, contactId?: string) => {
        try {
            if (contactId) {
                // delete contact from list API call
                await axios.delete(`${key}/api/contacts/lists/${listId}/contacts/${contactId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Contact removed from list successfully");
            } else {
                // delete entire list API call
                await axios.delete(`${key}/api/contacts/lists/${listId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Contact list deleted successfully");
            }
            fetchContactLists();
        } catch (error: any) {
            console.error("Failed to delete:", error);
            toast.error(error?.response?.data?.message || "Failed to delete");
        }
    };


    /**
     * Format ISO date string to DD/MM/YYYY format.
     * @param {string | undefined | null} dateString - ISO date string.
     * @returns {string} Formatted date or original string if invalid.
     */
    const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    if (loading) {
        return <p>Loading contacts...</p>;
    }

    return (
        <div className={styles.contactsContainer}>
            <button
                onClick={() => setIsInviting(true)}
                className={styles.inviteButton}
            >
                Invite to Event
            </button>

            <CreateContactsListForm onListCreated={() => {

                console.log("List created!");
            }} />

            {isInviting && (
                <div className={styles.inviteOverlay}>
                    <div className={styles.invitePopup}>
                        <h2>Invite to Event</h2>

                        <div>
                            <h3>Select an Event</h3>
                            {events.length === 0 && <p>No events found.</p>}
                            {events.map((e) => (
                                <div
                                    key={e._id}
                                    onClick={() => setCurrentEventId(e._id)}
                                    className={`${styles.eventItem} ${currentEventId === e._id ? styles.selectedEvent : ""
                                        }`}
                                >
                                    <h4>{e.name}</h4>
                                    <p>{e.description}</p>
                                    <p>Start: {formatDate(e.startDateTime)}</p>
                                    <p>End: {formatDate(e.endDateTime)}</p>
                                </div>
                            ))}
                        </div>

                        {currentEventId && (
                            <div>
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
                            onClick={() => {
                                setIsInviting(false);
                                setCurrentEventId("");
                                setSelectedUsername("");
                                setFeedback("");
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            <ul className={styles.contactLists}>
                {contactLists.map((list) => (
                    <li key={list._id} className={styles.contactListItem}>
                        <div className={styles.contactListHeader}>
                            <h4 className={styles.contactListTitle}>{list.title}</h4>
                            <button
                                onClick={() => handleDeleteContactFromList(list._id)}
                                className={styles.deleteListButton}
                            >
                                Delete List
                            </button>
                        </div>
                        <ul className={styles.contactListContacts}>
                            {list.contacts.map((contact: Contact) => (
                                <li key={contact._id} className={styles.contactListContactItem}>
                                    {contact.username}
                                    <button
                                        onClick={() => handleDeleteContactFromList(list._id, contact._id)}
                                        className={styles.deleteButton}
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>



            <ul className={styles.contactsList}>
            {contacts.map((contact) => {
    const showAvatar = false; // Force avatar to false

    return (
        <li key={contact._id}>
            {showAvatar && contact.avatar ? (
                <img
                    src={contact.avatar}
                    alt={contact.username}
                    className={styles.avatar}
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #1976d2",
                        boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)",
                    }}
                />
            ) : (
                <div
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#1976d2",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "bold",
                        border: "2px solid #1976d2",
                        boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)",
                        userSelect: "none",
                    }}
                >
                    {`${contact.firstName?.charAt(0) || ""}${contact.lastName?.charAt(0) || ""}`}
                </div>
            )}
            <span>{contact.username}</span>
        </li>
    );
})}
</ul>

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

export default Contacts;
