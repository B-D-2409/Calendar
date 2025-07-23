import EventForm from "../Events/EventForm";
import style from './Event.module.css';
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useContext, useState } from "react";

function CreateEvent() {
    const { user, isLoggedIn } = useContext(AuthContext) as AuthContextType;
    const [showCreateForm, setShowCreateForm] = useState(false);
    const handleEventCreated = (newEvent: any) => {
        console.log("Event created:", newEvent);
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
        </div>
    );
}

export default CreateEvent;
