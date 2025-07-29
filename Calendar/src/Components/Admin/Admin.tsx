import { useContext, useEffect, useState, ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../Common/AuthContext";
import style from './Admin.module.css';
import { io, Socket } from "socket.io-client";
import { AuthContextType } from "../../Common/AuthContext";
import axios from 'axios';
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

/**
 * Represents a user in the system.
 * @typedef {Object} User
 * @property {string} _id - Unique identifier.
 * @property {string} firstName - User's first name.
 * @property {string} lastName - User's last name.
 * @property {string} email - User's email address.
 * @property {string} username - User's username.
 * @property {boolean} isBlocked - Indicates if the user is blocked.
 * @property {string} [role] - User's role (optional).
 */
interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    isBlocked: boolean;
    role?: string;
}



/**
 * Represents an event in the system.
 * @typedef {Object} Event
 * @property {string} _id - Unique identifier.
 * @property {string} title - Event title.
 * @property {string} description - Event description.
 */
interface Event {
    _id: string;
    title: string;
    description: string;
}


/**
 * Represents a request to delete a user.
 * @typedef {Object} DeleteRequest
 * @property {string} _id - Request ID.
 * @property {Object} [userId] - User data for deletion (optional).
 * @property {string} userId._id - User ID.
 * @property {string} userId.username - Username.
 * @property {string} userId.email - Email.
 */
interface DeleteRequest {
    _id: string;
    userId?: {
        _id: string;
        username: string;
        email: string;
    };
}


/**
 * Admin dashboard component that manages users, events, and delete requests.
 *
 * - Allows blocking/unblocking and deleting users.
 * - Displays paginated users and events with search.
 * - Allows editing and deleting events.
 * - Handles delete requests submitted by users.
 *
 * @component
 * @returns {JSX.Element} Admin panel page or redirect if unauthorized.
 */

function Admin() {
    const { isLoggedIn, user } = useContext(AuthContext) as AuthContextType;

    const [search, setSearch] = useState<string>("");

    const [allUsers, setAllUsers] = useState<User[]>([]);

    const [searchEvents, setSearchEvents] = useState<Event[]>([]);

    const [findEvents, setFindEvents] = useState<string>("");

    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);

    const [eventData, setEventData] = useState<{ title: string; description: string }>({
        title: "",
        description: "",
    });

    const [currentPageUsers, setCurrentPageUsers] = useState<number>(1);

    const [totalPagesUsers, setTotalPagesUsers] = useState<number>(1);

    const [currentPageEvents, setCurrentPageEvents] = useState<number>(1);

    const [totalPagesEvents, setTotalPagesEvents] = useState<number>(1);




    // Setup WebSocket connection for real-time communication
    useEffect(() => {
        const socket: Socket = io(key, {
            withCredentials: true,
            query: {
                token: localStorage.getItem("token") || "",
            },
        });

        socket.on("connect", () => {
            console.log("Connected with socket id:", socket.id);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connect error:", err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Fetch delete requests
    useEffect(() => {
        fetch(`${key}/api/admin/delete-requests`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then((res) => res.json())
            .then((data: DeleteRequest[]) => setDeleteRequests(data))
            .catch((err) => console.error(err));
    }, []);

    // Fetch events with pagination and search
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(
                    `${key}/api/admin/events?page=${currentPageEvents}&limit=5&search=${encodeURIComponent(findEvents)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                const data: { events: Event[]; totalPages: number } = res.data;
                setSearchEvents(data.events || []);
                setTotalPagesEvents(data.totalPages || 1);
            } catch (err) {
                console.error("Error loading admin events", err);
            }
        };

        fetchEvents();
    }, [currentPageEvents, findEvents]);



    // Fetch users with pagination
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found");
            return;
        }

        const fetchUsers = async () => {
            try {
                const res = await axios.get(
                    `${key}/api/admin/users?page=${currentPageUsers}&limit=5&search=${encodeURIComponent(search)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data: { users: User[]; totalPages: number } = res.data;
                setAllUsers(data.users || []);
                setTotalPagesUsers(data.totalPages || 1);
            } catch (err) {
                console.error("Error loading admin users", err);
            }
        }

        fetchUsers();
    }, [currentPageUsers]);


    /** Filters users based on search text */
    const filteredUsers = allUsers.filter((u) =>
        [u.firstName, u.email, u.username, u.lastName].some((field) =>
            field?.toLowerCase().includes(search.toLowerCase())
        )
    );

    /**
  * Block or unblock a user by ID.
  * @param {string} id - User ID.
  * @param {boolean} block - True to block, false to unblock.
  */
    const toggleBlock = async (id: string, block: boolean) => {
        const endpoint = `${key}/api/admin/${block ? "block" : "unblock"}/${id}`;
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (res.ok) {
            setAllUsers((users) =>
                users.map((u) => (u._id === id ? { ...u, isBlocked: block } : u))
            );
        }
    };
    const deleteUser = async (id: string) => {
        try {
            const res = await fetch(`${key}/api/admin/delete/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message); // ✅ Shows "User ... has been deleted"
                setAllUsers((users) => users.filter((u) => u._id !== id));
            } else {
                alert(`❌ Failed: ${data.message}`);
            }
        } catch (error) {
            alert("❌ Network error");
            console.error("Delete error:", error);
        }
    };


    /**
     * Delete a user by ID.
     * @param {string} id - User ID.
     */
    const deleteEvent = async (id: string) => {
        try {
            const res = await fetch(`${key}/api/admin/events/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (res.ok) {
                setSearchEvents((events) => events.filter((e) => e._id !== id));
            } else {
                const error = await res.json();
                alert("Failed to delete event: " + error.message);
            }
        } catch (error) {
            alert("An error occurred while deleting the event.");
        }
    };

        /**
     * Start editing an event.
     * @param {Event} event - Event to edit.
     */
    const startEditingEvent = (event: Event) => {
        setEditingEventId(event._id);
        setEventData({ title: event.title, description: event.description });
    };

        /** Cancel editing an event. */
    const cancelEditing = () => {
        setEditingEventId(null);
        setEventData({ title: "", description: "" });
    };


       /** Save edited event. Sends PUT request. */
    const saveEdit = async () => {
        if (!editingEventId) return;

        try {
            const res = await fetch(`${key}/api/admin/events/${editingEventId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(eventData), // Ensure eventData contains the necessary fields (title, description)
            });

            if (res.ok) {
                const updatedEvent: Event = await res.json();
                setSearchEvents((events) =>
                    events.map((e) => (e._id === editingEventId ? updatedEvent : e))
                );
                cancelEditing();
            } else {
                const error = await res.json();
                alert("Failed to update event: " + error.message);
            }
        } catch (err) {
            console.error("Error updating event:", err);
            alert("An error occurred while updating the event.");
        }
    };


    /** Filters events based on search term */
    const filteredEvents = searchEvents.filter((event) =>
        [event.title, event.description].some((field) =>
            field.toLowerCase().includes(findEvents.toLowerCase())
        )
    );
    // Redirect if not an admin
    if (!isLoggedIn || user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    /**
     * Approve and process a user delete request.
     * @param {string} userId - ID of the user to delete.
     */
    const handleApprove = async (userId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/delete-requests/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to create delete request');
            }

            alert(`Delete request for user ${userId} has been created.`);
        } catch (error: unknown) {
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
            } else {
                alert('An unknown error occurred');
            }
        }
    };


    return (
        <div className={style.adminContainer}>
            <h2 className={style.adminTitle}>Administration Hub</h2>

            <div className={style.sectionsContainer}>
                <section className={style.panel}>
                    <h3 className={style.panelTitle}>Users</h3>
                    <input
                        type="text"
                        placeholder="Search users"
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className={style.searchInput}
                    />
                    <ul className={style.userList}>
                        {filteredUsers.map((u) => (
                            <li key={u._id} className={style.userListItem}>
                                <div className={style.userInfo}>
                                    <span className={style.userName}>{u.firstName}</span>
                                    <span className={style.userEmail}>({u.email})</span>
                                </div>
                                <div className={style.userAction}>
                                    <button
                                        className={u.isBlocked ? style.btnUnblock : style.btnBlock}
                                        onClick={() => toggleBlock(u._id, !u.isBlocked)}
                                    >
                                        {u.isBlocked ? "Unblock" : "Block"}
                                    </button>
                                    <button
                                        onClick={() => deleteUser(u._id)}
                                        className={style.deleteButton}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className={style.paginationControls}>
                        <button
                            onClick={() => setCurrentPageUsers((p) => Math.max(p - 1, 1))}
                            disabled={currentPageUsers === 1}
                            className={style.pageButton}
                        >
                            Prev
                        </button>
                        <span className={style.pageInfo}>
                            Page {currentPageUsers} of {totalPagesUsers}
                        </span>
                        <button
                            onClick={() => setCurrentPageUsers((p) => Math.min(p + 1, totalPagesUsers))}
                            disabled={currentPageUsers === totalPagesUsers}
                            className={style.pageButton}
                        >
                            Next
                        </button>
                    </div>
                </section>

                <section className={style.panel}>
                    <h3 className={style.panelTitle}>Events</h3>
                    <input
                        type="text"
                        placeholder="Search events"
                        value={findEvents}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFindEvents(e.target.value)}
                        className={style.searchInput}
                    />

                    <ul className={style.eventList}>
                        {filteredEvents.map((event) => (
                            <li key={event._id} className={style.eventListItem}>
                                {editingEventId === event._id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={eventData.title}
                                            onChange={(e) =>
                                                setEventData((prev) => ({ ...prev, title: e.target.value }))
                                            }
                                            className={style.editInput}
                                        />
                                        <textarea
                                            value={eventData.description}
                                            onChange={(e) =>
                                                setEventData((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                            className={style.editTextarea}
                                        />
                                        <button onClick={saveEdit} className={style.saveButton}>
                                            Save
                                        </button>
                                        <button onClick={cancelEditing} className={style.cancelButton}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h4 className={style.eventTitle}>{event.title}</h4>
                                        <p className={style.eventDescription}>{event.description}</p>
                                        <button
                                            onClick={() => startEditingEvent(event)}
                                            className={style.editButton}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(event._id)}
                                            className={style.deleteButton}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className={style.paginationControls}>
                        <button
                            onClick={() => setCurrentPageEvents((p) => Math.max(p - 1, 1))}
                            disabled={currentPageEvents === 1}
                            className={style.pageButton}
                        >
                            Prev
                        </button>
                        <span className={style.pageInfo}>
                            Page {currentPageEvents} of {totalPagesEvents}
                        </span>
                        <button
                            onClick={() => setCurrentPageEvents((p) => Math.min(p + 1, totalPagesEvents))}
                            disabled={currentPageEvents === totalPagesEvents}
                            className={style.pageButton}
                        >
                            Next
                        </button>
                    </div>
                </section>

                <section className={style.panel}>
                    <h3 className={style.panelTitle}>Delete Requests</h3>
                    <ul className={style.deleteRequestsList}>
                        {Array.isArray(deleteRequests) && deleteRequests.map((req) => (
                            <li key={req._id} className={style.deleteRequestItem}>
                                <span>
                                    User: {req.userId?.username} ({req.userId?.email})
                                </span>
                                <button
                                    onClick={() => handleApprove(req._id)}
                                    className={style.approveButton}
                                >
                                    Approve
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default Admin;
