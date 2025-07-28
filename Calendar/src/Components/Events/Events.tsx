import EventForm from "../Events/EventForm";
import style from "./Events.module.css";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useContext, useState } from "react";

function CreateEvent() {
    const { user, isLoggedIn } = useContext(AuthContext) as AuthContextType;
    const [showCreateForm, setShowCreateForm] = useState(false);
    const handleEventCreated = (newEvent: any) => {
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
            <EventForm
                onEventCreated={handleEventCreated}
                user={user}
                setShowCreateForm={setShowCreateForm}
            />

<button
                type="button"
                className={style.cancelButton}
                onClick={() => setShowCreateForm(false)}  // Close the form when Cancel is clicked
                aria-label="Cancel form"
            >
                Cancel
            </button>
        </div>
    );
}

export default CreateEvent;
