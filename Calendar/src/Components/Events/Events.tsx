import EventForm from "../Events/EventForm";
import style from "./Events.module.css";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useContext, useState } from "react";

/**
 * Component to handle the creation of a new event.
 * 
 * It shows a button to toggle the event creation form. If the user is not logged in,
 * it displays a message prompting login.
 * 
 * @component
 * @example
 * return (
 *   <CreateEvent />
 * )
 * 
 * @returns {JSX.Element} The event creation UI component.
 */
function CreateEvent() {
    const { user, isLoggedIn } = useContext(AuthContext) as AuthContextType;
    const [showCreateForm, setShowCreateForm] = useState(false);

    /**
     * Callback triggered when a new event is successfully created.
     * 
     * @param {any} newEvent - The newly created event object.
     */
    const handleEventCreated = (newEvent: any) => {
        console.log("New event created:", newEvent);
        setShowCreateForm(false);
        // Optional: add logic to update event list or show notifications here
    };

    if (!isLoggedIn) {
        return (
            <div className={style.event}>
                <p>You must be logged in to create an event.</p>
            </div>
        );
    }

    return (
        <div className={style.event}>
            {!showCreateForm ? (
                <button onClick={() => setShowCreateForm(true)}>Create New Event</button>
            ) : (
                <EventForm
                    onEventCreated={handleEventCreated}
                    user={user}
                    setShowCreateForm={setShowCreateForm}
                />
            )}
        </div>
    );
}

export default CreateEvent;
