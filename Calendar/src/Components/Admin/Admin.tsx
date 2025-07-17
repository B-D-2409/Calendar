import { useContext, useEffect, useState, ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../Common/AuthContext";
import styles from "./Admin.module.css";
import { io, Socket } from "socket.io-client";
import { AuthContextType } from "../../Common/AuthContext";
import axios from 'axios';
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    isBlocked: boolean;
    role?: string;
}

interface Event {
    _id: string;
    title: string;
    description: string;
}

interface DeleteRequest {
    _id: string;
    userId?: {
        _id: string;
        username: string;
        email: string;
    };
}

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

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(
                    `${key}/api/events/admin?page=${currentPageEvents}&limit=5&search=${encodeURIComponent(findEvents)}`,
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

    const filteredUsers = allUsers.filter((u) =>
        [u.firstName, u.email, u.username, u.lastName].some((field) =>
            field?.toLowerCase().includes(search.toLowerCase())
        )
    );

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
        const res = await fetch(`${key}/api/admin/delete/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (res.ok) {
            setAllUsers((users) => users.filter((u) => u._id !== id));
        } else {
            const error = await res.json();
            alert("Failed to delete user: " + error.message);
        }
    };

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

    const startEditingEvent = (event: Event) => {
        setEditingEventId(event._id);
        setEventData({ title: event.title, description: event.description });
    };

    const cancelEditing = () => {
        setEditingEventId(null);
        setEventData({ title: "", description: "" });
    };

    const saveEdit = async () => {
        if (!editingEventId) return;

        try {
            const res = await fetch(`${key}/api/events/admin/${editingEventId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(eventData),
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
            console.error(err);
        }
    };

    const filteredEvents = searchEvents.filter((event) =>
        [event.title, event.description].some((field) =>
            field.toLowerCase().includes(findEvents.toLowerCase())
        )
    );

    // Redirect if user is not logged in or not admin
    if (!isLoggedIn || user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    // Dummy placeholder for handleApprove - add your own implementation
    const handleApprove = (userId: string) => {
        alert(`Approve deletion for user ${userId} - implement this`);
    };

    return (
        <div className={styles.adminContainer}>
            <h2 className={styles.adminTitle}>Administration Hub</h2>

            <div className={styles.sectionsContainer}>
                <section className={styles.panel}>
                    <h3 className={styles.panelTitle}>Users</h3>
                    <input
                        type="text"
                        placeholder="Search users"
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                    <ul className={styles.userList}>
                        {filteredUsers.map((u) => (
                            <li key={u._id} className={styles.userListItem}>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{u.firstName}</span>
                                    <span className={styles.userEmail}>({u.email})</span>
                                </div>
                                <div className={styles.userAction}>
                                    <button
                                        className={u.isBlocked ? styles.btnUnblock : styles.btnBlock}
                                        onClick={() => toggleBlock(u._id, !u.isBlocked)}
                                    >
                                        {u.isBlocked ? "Unblock" : "Block"}
                                    </button>
                                    <button
                                        onClick={() => deleteUser(u._id)}
                                        className={styles.deleteButton}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className={styles.paginationControls}>
                        <button
                            onClick={() => setCurrentPageUsers((p) => Math.max(p - 1, 1))}
                            disabled={currentPageUsers === 1}
                            className={styles.pageButton}
                        >
                            Prev
                        </button>
                        <span className={styles.pageInfo}>
                            Page {currentPageUsers} of {totalPagesUsers}
                        </span>
                        <button
                            onClick={() => setCurrentPageUsers((p) => Math.min(p + 1, totalPagesUsers))}
                            disabled={currentPageUsers === totalPagesUsers}
                            className={styles.pageButton}
                        >
                            Next
                        </button>
                    </div>
                </section>

                <section className={styles.panel}>
                    <h3 className={styles.panelTitle}>Events</h3>
                    <input
                        type="text"
                        placeholder="Search events"
                        value={findEvents}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFindEvents(e.target.value)}
                        className={styles.searchInput}
                    />

                    <ul className={styles.eventList}>
                        {filteredEvents.map((event) => (
                            <li key={event._id} className={styles.eventListItem}>
                                {editingEventId === event._id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={eventData.title}
                                            onChange={(e) =>
                                                setEventData((prev) => ({ ...prev, title: e.target.value }))
                                            }
                                            className={styles.editInput}
                                        />
                                        <textarea
                                            value={eventData.description}
                                            onChange={(e) =>
                                                setEventData((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                            className={styles.editTextarea}
                                        />
                                        <button onClick={saveEdit} className={styles.saveButton}>
                                            Save
                                        </button>
                                        <button onClick={cancelEditing} className={styles.cancelButton}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h4 className={styles.eventTitle}>{event.title}</h4>
                                        <p className={styles.eventDescription}>{event.description}</p>
                                        <button
                                            onClick={() => startEditingEvent(event)}
                                            className={styles.editButton}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(event._id)}
                                            className={styles.deleteButton}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className={styles.paginationControls}>
                        <button
                            onClick={() => setCurrentPageEvents((p) => Math.max(p - 1, 1))}
                            disabled={currentPageEvents === 1}
                            className={styles.pageButton}
                        >
                            Prev
                        </button>
                        <span className={styles.pageInfo}>
                            Page {currentPageEvents} of {totalPagesEvents}
                        </span>
                        <button
                            onClick={() => setCurrentPageEvents((p) => Math.min(p + 1, totalPagesEvents))}
                            disabled={currentPageEvents === totalPagesEvents}
                            className={styles.pageButton}
                        >
                            Next
                        </button>
                    </div>
                </section>

                <section className={styles.panel}>
                    <h3 className={styles.panelTitle}>Delete Requests</h3>
                    <ul className={styles.deleteRequestsList}>
                        {Array.isArray(deleteRequests) && deleteRequests.map((req) => (
                            <li key={req._id} className={styles.deleteRequestItem}>
                                <span>
                                    User: {req.userId?.username} ({req.userId?.email})
                                </span>
                                <button
                                    onClick={() => handleApprove(req._id)}
                                    className={styles.approveButton}
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
