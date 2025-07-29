/**
 * @file Notifications.tsx
 * @description React component to display and manage event invitations using API calls.
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import styles from "./Notifications.module.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


/**
 * Represents an event invitation.
 * 
 * @interface EventInvite
 * @property {string} _id - The unique identifier of the event.
 * @property {string} title - The title of the event.
 * @property {{ username: string }} creator - The user who created the event.
 */
interface EventInvite {
    _id: string;
    title: string;
    creator: { username: string };
}

/**
 * A React component that fetches and displays a list of event invitations for the authenticated user.
 * Allows the user to accept or reject each invitation via API requests.
 *
 * @component
 * returns {JSX.Element} The rendered component.
 */
function Notifications() {
    const [invitations, setInvitations] = useState<EventInvite[]>([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        /**
       * Fetches event invitations from the server and updates component state.
       * Displays an error toast if the request fails.
       */
        const fetchInvites = async () => {
            try {
                const res = await axios.get("/api/events/invitations", {
                    headers: { Authorization: `Bearer ${token}` },
                });


                if (Array.isArray(res.data)) {
                    setInvitations(res.data);
                } else {
                    console.error("Expected an array but got:", res.data);
                    setInvitations([]);
                }
            } catch (error) {
                toast.error("Failed to fetch invitations.");
                console.error(error);
            }
        };

        fetchInvites();
    }, [token]);



    /**
     * Accepts an event invitation.
     * Sends a POST request to the server and removes the invitation from state.
     *
     * @param {string} eventId - The ID of the event to accept.
     */
    const handleAccept = async (eventId: string) => {
        try {
            await axios.post(`/api/events/invitations/${eventId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Invitation accepted!");
            setInvitations((prev) => prev.filter((e) => e._id !== eventId));
        } catch {
            toast.error("Failed to accept invitation.");
        }
    };

    /**
  * Rejects an event invitation.
  * Sends a POST request to the server and removes the invitation from state.
  *
  * @param {string} eventId - The ID of the event to reject.
  */
    const handleReject = async (eventId: string) => {
        try {
            await axios.post(`/api/events/invitations/${eventId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.info("Invitation rejected.");
            setInvitations((prev) => prev.filter((e) => e._id !== eventId));
        } catch {
            toast.error("Failed to reject invitation.");
        }
    };

    if (!invitations.length) return <p className={styles.emptyText}>No pending invitations.</p>;

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Your Invitations</h2>

            {invitations.length === 0 ? (
                <p className={styles.emptyText}>No pending invitations.</p>
            ) : (
                <div className={styles.inviteList}>
                    {invitations.map((invite) => (
                        <div key={invite._id} className={styles.inviteCard}>
                            <p className={styles.inviteText}>
                                <strong>{invite.title}</strong> invited by <em>{invite.creator.username}</em>
                            </p>
                            <div className={styles.buttonGroup}>
                                <button
                                    onClick={() => handleAccept(invite._id)}
                                    className={styles.acceptBtn}
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleReject(invite._id)}
                                    className={styles.rejectBtn}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
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
        </div>
    );
}

export default Notifications;
