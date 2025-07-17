
import React, { useEffect, useState } from "react";
import EventForm from "../../Components/Events/EventForm";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import style from "./MyEventsPage.module.css";
import { CustomSpinner } from "../PublicPage/PublicPage";
import {Link} from "react-router-dom";
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";
interface RecurrenceRule {
    frequency?: "daily" | "weekly" | "monthly";
    interval?: number;
    endDate?: Date | string;
}

interface Event {
    title: string;
    description: string;
    type: string;
    creatorName?: string;
    startDateTime: string;
    endDateTime: string;
    isRecurring: boolean;
    isLocation: boolean;
    participants: string[];
    location: Location;
    recurrenceRule?: RecurrenceRule;
    _id?: string;
}

function MyEventsPage() {

    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"myEvents" | "participating">("myEvents");




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


    useEffect(() => {
        const handleEventLeft = (e: CustomEvent<{ eventId: string }>) => {
            const { eventId } = e.detail;
            setParticipatingEvents((prev) =>
                prev.filter((event) => event._id !== eventId)
            );
        };

        window.addEventListener("eventLeft", handleEventLeft as EventListener);
        return () => {
            window.removeEventListener("eventLeft", handleEventLeft as EventListener);
        };
    }, []);



    const handleEventCreated = (newEvent: any) => {
        setMyEvents((prev) => [newEvent, ...prev]);
        toast.success("Event created successfully!");
    };


    const handleDeleteEvent = async (event: any) => {
        if (!event._id) return;
        try {
            await axios.delete(`${key}/api/events/${event._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setMyEvents((prev) => prev.filter((e) => e._id !== event._id));
            toast.success(`Event successfully deleted`);
        } catch (err) {
            alert("Failed to delete event");
            toast.error(err instanceof Error ? err.message : "An error occurred");
        }
    };
    return (
        <>
            <div
                className={`${style.myeventsContainerWithTabs} ${showCreateForm ? style.blurred : ""
                    }`}
            >
                <h1 className={style.myeventsTitleH1}>Manage & Create Your Events</h1>

                <div className={style.myeventsBoxContainerTabs}>
                    <div className={style.tabsRoot}>
                        <div className={style.tabsList}>
                            <button
                                className={`${style.tabTrigger} ${activeTab === "myEvents" ? style.activeTab : ""
                                    }`}
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
                                className={`${style.tabTrigger} ${activeTab === "participating" ? style.activeTab : ""
                                    }`}
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
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                maxWidth: "100%",
                                                margin: "0 auto",
                                                gap: "20px",
                                                justifyContent: "center",
                                            }}
                                        >
                                          {myEvents.map((event) => (
  <div
    key={event._id || event.title + event.startDateTime}
    style={{
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "16px",
      width: "280px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <h2>{event.title}</h2>
    <p>{event.description}</p>
    <p>Date: {new Date(event.startDateTime).toLocaleString()}</p>

    {/* 🔵 New Link to event details */}
    <Link
      to={`/eventdetailspage/${event._id}`}
      style={{
        marginTop: "8px",
        textAlign: "center",
        padding: "8px",
        backgroundColor: "#3498db",
        color: "white",
        textDecoration: "none",
        borderRadius: "4px",
      }}
    >
      See Details
    </Link>

    <button
      onClick={() => handleDeleteEvent(event._id)}
      style={{
        marginTop: "8px",
        padding: "8px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#e74c3c",
        color: "white",
        cursor: "pointer",
      }}
    >
      Delete
    </button>
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
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                maxWidth: "100%",
                                                margin: "0 auto",
                                                gap: "20px",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {participatingEvents.map((event) => (
                                                <div
                                                    key={event._id || event.title + event.startDateTime}
                                                    style={{
                                                        border: "1px solid #ccc",
                                                        borderRadius: "8px",
                                                        padding: "16px",
                                                        width: "280px",
                                                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "space-between",
                                                    }}
                                                >
                                                    <h2>{event.title}</h2>
                                                    <p>{event.description}</p>
                                                    <p>Date: {new Date(event.startDateTime).toLocaleString()}</p>

                                                    {event.creatorName && (
                                                        <p style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
                                                            Created by: {event.creatorName}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>You're not participating in any events yet.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <ToastContainer position="bottom-right" />
            </div>

            {showCreateForm && (
                <div className={style.modalOverlay} onClick={() => setShowCreateForm(false)}>
                    <div className={style.modalContent} onClick={(e) => e.stopPropagation()}>
                        <EventForm
                            onEventCreated={(newEvent) => {
                                handleEventCreated(newEvent);
                                setShowCreateForm(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );


}

export default MyEventsPage;
