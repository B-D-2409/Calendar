import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import styles from "./Contacts.module.css";
import { CreateContactsListForm } from "../../ContactListFrom/CreateContactListForm";
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

    const handleSendInvite = async () => {
        if (!selectedUsername.trim()) {
            setFeedback("Please enter a username");
            return;
        }
        if (!currentEventId) {
            setFeedback("Please select an event");
            return;
        }

        try {

            const userRes = await axios.get(
                `${key}/api/contacts/username/${selectedUsername.trim()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const userId = userRes.data._id;


            await axios.post(
                `${key}/api/contacts/${currentEventId}/participants/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Invite sent to ${selectedUsername}`);
            setFeedback(`Invite sent to ${selectedUsername}`);
            setSelectedUsername("");
        } catch (error: any) {
            console.error("Failed to send invite:", error);
            toast.error(
                error?.response?.data?.message || "Failed to send invite"
            );
            setFeedback("Failed to send invite");
        }
    };

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
                {contacts.map((contact) => (
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

            <ToastContainer    position="bottom-right"
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
