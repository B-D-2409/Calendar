import style from './Events.module.css';
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../Common/AuthContext";
import { AuthContextType } from "../../Common/AuthContext";

const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface Location {
    address: string;
    city: string;
    country: string;
}
interface RecurrenceRule {
    frequency?: "daily" | "weekly" | "monthly";
    interval?: number;
    endDate?: Date | string;
}

interface EventState {
    title: string;
    description: string;
    type: string;
    startDateTime: string;
    endDateTime: string;
    isRecurring: boolean;
    isLocation: boolean;
    participants: string[];
    location: Location;
    recurrenceRule?: RecurrenceRule;
}

interface EventFormProps {
    onEventCreated?: (event: EventState) => void;
}
interface LocationErrors {
    address?: string;
    city?: string;
    country?: string;
}

interface RecurrenceRuleErrors {
    frequency?: string;
    interval?: string;
}

interface EventFormErrors {
    title?: string;
    description?: string;
    type?: string;
    startDateTime?: string;
    endDateTime?: string;
    participants?: string;
    location?: LocationErrors;
    recurrenceRule?: RecurrenceRuleErrors;
}
interface User {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    isBlocked?: boolean;
    [key: string]: any;
}




const EventForm: React.FC<EventFormProps> = ({ onEventCreated }) => {
    const [event, setEvent] = useState<EventState>({
        title: "",
        description: "",
        type: "",
        startDateTime: "",
        endDateTime: "",
        isRecurring: false,
        isLocation: false,
        participants: [],
        location: {
            address: "",
            city: "",
            country: "",
        },
        recurrenceRule: {
            frequency: undefined,
            interval: 1,
            endDate: "",
        },
    });



    const { user } = useContext(AuthContext) as AuthContextType;
    const [users, setUsers] = useState<User[]>([]);
    const [errors, setErrors] = useState<EventFormErrors>({});
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [participantName, setParticipantName] = useState<string>("");


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${key}/api/auth/users`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUsers(response.data);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        };

        fetchUsers();
    }, []);


    const addParticipant = () => {
        const trimmedName = participantName.trim();
        if (trimmedName) {
            setEvent((prev) => ({
                ...prev,
                participants: [...prev.participants, trimmedName],
            }));
            setParticipantName("");
        }
    };


    const removeParticipant = (index: number) => {
        setEvent((prev) => ({
            ...prev,
            participants: prev.participants.filter((_, i) => i !== index),
        }));
    };


    const handleParticipantChange = (index: number, value: string) => {
        const newParticipants = [...event.participants];
        newParticipants[index] = value;
        setEvent((prev) => ({
            ...prev,
            participants: newParticipants,
        }));

        if (errors.participants) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                participants: "",
            }));
        }
    };


    const handleChange = (prop: keyof EventState, value: any) => {
        setEvent({ ...event, [prop]: value });
        setErrors({ ...errors, [prop]: "" });
    };


    const handleLocationChange = (field: keyof Location, value: string) => {
        setEvent({
            ...event,
            location: {
                ...event.location,
                [field]: value,
            },
        });

        if (errors.location) {
            setErrors({
                ...errors,
                location: {
                    ...errors.location,
                    [field]: "",
                },
            });
        }
    };


    const handleRecurrenceChange = (key: keyof RecurrenceRule, value: any) => {
        setEvent({
            ...event,
            recurrenceRule: {
                ...event.recurrenceRule,
                [key]: value,
            },
        });
        setErrors({
            ...errors,
            recurrenceRule: { ...errors.recurrenceRule, [key]: "" },
        });
    };


    const validate = (): boolean => {
        const newErrors: EventFormErrors = {};

        if (!event.title || event.title.length < 3 || event.title.length > 30) {
            newErrors.title = "Title must be between 3 and 30 characters.";
        }

        if (
            !event.description ||
            event.description.length < 10 ||
            event.description.length > 500
        ) {
            newErrors.description =
                "Description must be between 10 and 500 characters.";
        }

        if (!event.type) {
            newErrors.type = "Please select a type.";
        }

        if (!event.startDateTime) {
            newErrors.startDateTime = "Start date and time is required.";
        }

        if (!event.endDateTime) {
            newErrors.endDateTime = "End date and time is required.";
        }

        // ✅ Explicitly type locErrors
        const locErrors: LocationErrors = {};
        const { address, city, country } = event.location;

        if (address && (address.length < 5 || address.length > 100)) {
            locErrors.address = "Address must be between 5 and 100 characters.";
        }

        if (city && (city.length < 2 || city.length > 50)) {
            locErrors.city = "City must be between 2 and 50 characters.";
        }

        if (country && (country.length < 2 || country.length > 50)) {
            locErrors.country = "Country must be between 2 and 50 characters.";
        }

        if (Object.keys(locErrors).length > 0) {
            newErrors.location = locErrors;
        }

        if (event.isRecurring) {
            const recurrenceErrors: RecurrenceRuleErrors = {};

            if (!event.recurrenceRule || !event.recurrenceRule.frequency) {
                recurrenceErrors.frequency = "Frequency is required for recurring events.";
            }

            if (!event.recurrenceRule || !event.recurrenceRule.interval || event.recurrenceRule.interval < 1) {
                recurrenceErrors.interval = "Interval must be at least 1.";
            }

            if (Object.keys(recurrenceErrors).length > 0) {
                newErrors.recurrenceRule = recurrenceErrors;
            }
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSuccessMessage("");

        if (!validate()) return;
        const preparedEvent = { ...event };

        if (!preparedEvent.isRecurring) {
            delete preparedEvent.recurrenceRule;
        } else if (preparedEvent.recurrenceRule) {
        
            if (
                !["daily", "weekly", "monthly"].includes(
                    preparedEvent.recurrenceRule.frequency || ""
                )
            ) {
                preparedEvent.recurrenceRule.frequency = undefined;
            }
        
            if (!preparedEvent.recurrenceRule.endDate) {
                delete preparedEvent.recurrenceRule.endDate;
            } else {
                preparedEvent.recurrenceRule.endDate = new Date(
                    preparedEvent.recurrenceRule.endDate
                );
            }
        }
        
        try {
            const res = await axios.post(`${key}/api/events/events`, preparedEvent, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                withCredentials: true,
            });
            const createdEvent = res.data;
            setSuccessMessage("✅ Event created successfully!");
            setEvent({
                title: "",
                description: "",
                type: "",
                startDateTime: "",
                endDateTime: "",
                isRecurring: false,
                isLocation: false,
                participants: [],
                location: {
                    address: "",
                    city: "",
                    country: "",
                },
                recurrenceRule: {
                    frequency: undefined,
                    interval: 1,
                    endDate: "",
                },
            });
            setErrors({});
            if (onEventCreated) onEventCreated(createdEvent);
        } catch (err) {
            console.error(err);
            setSuccessMessage("❌ Failed to create event.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className={style.formContainer}>
            <fieldset className={style.fieldset}>
                <legend className={style.legend}>Create New Event</legend>

                {successMessage && (
                    <p
                        className={
                            successMessage.startsWith('✅')
                                ? style.successMessage
                                : style.errorMessage
                        }
                    >
                        {successMessage}
                    </p>
                )}

                <div className={style.field}>
                    <label className={style.label}>Title</label>
                    <input
                        className={`${style.input} ${errors.title ? style.invalid : ''}`}
                        value={event.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                    />
                    {errors.title && <p className={style.errorText}>{errors.title}</p>}
                </div>

                <div className={style.field}>
                    <label className={style.label}>Description</label>
                    <textarea
                        className={`${style.textarea} ${errors.description ? style.invalid : ''}`}
                        value={event.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />
                    {errors.description && <p className={style.errorText}>{errors.description}</p>}
                </div>

                <div className={style.field}>
                    <label className={style.label}>Add Location</label>
                    <select
                        className={style.select}
                        value={event.isLocation ? 'yes' : 'no'}
                        onChange={(e) => handleChange('isLocation', e.target.value === 'yes')}
                    >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>

                {event.isLocation && (
                    <>
                        <div className={style.field}>
                            <label className={style.label}>Address</label>
                            <input
                                className={`${style.input} ${errors.location?.address ? style.invalid : ''
                                    }`}
                                value={event.location.address}
                                onChange={(e) => handleLocationChange('address', e.target.value)}
                            />
                            {errors.location?.address && (
                                <p className={style.errorText}>{errors.location.address}</p>
                            )}
                        </div>

                        <div className={style.field}>
                            <label className={style.label}>City</label>
                            <input
                                className={`${style.input} ${errors.location?.city ? style.invalid : ''
                                    }`}
                                value={event.location.city}
                                onChange={(e) => handleLocationChange('city', e.target.value)}
                            />
                            {errors.location?.city && (
                                <p className={style.errorText}>{errors.location.city}</p>
                            )}
                        </div>

                        <div className={style.field}>
                            <label className={style.label}>Country</label>
                            <input
                                className={`${style.input} ${errors.location?.country ? style.invalid : ''
                                    }`}
                                value={event.location.country}
                                onChange={(e) => handleLocationChange('country', e.target.value)}
                            />
                            {errors.location?.country && (
                                <p className={style.errorText}>{errors.location.country}</p>
                            )}
                        </div>
                    </>
                )}

                <div className={style.field}>
                    <label className={style.label}>Participants</label>

                    <div className={style.participantAddRow}>
                        <select
                            className={style.select}
                            value={participantName}
                            onChange={(e) => setParticipantName(e.target.value)}
                        >
                            <option value="">Select a user</option>
                            {users
                                .filter((u) => u._id !== user?._id)
                                .map((u) => (
                                    <option key={u._id} value={u.username}>
                                        {u.username}
                                    </option>
                                ))}
                        </select>
                        <button
                            type="button"
                            className={style.buttonOutlineSm}
                            onClick={addParticipant}
                        >
                            + Add
                        </button>
                    </div>

                    {event.participants.map((participant, index) => (
                        <div key={index} className={style.participantRow}>
                            <input
                                className={`${style.input} ${errors.participants ? style.invalid : ''}`}
                                value={participant}
                                onChange={(e) => handleParticipantChange(index, e.target.value)}
                            />
                            <button
                                type="button"
                                className={style.buttonDangerSm}
                                onClick={() => removeParticipant(index)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    {errors.participants && (
                        <p className={style.errorText}>{errors.participants}</p>
                    )}
                </div>

                <div className={style.field}>
                    <label className={style.label}>Type</label>
                    <select
                        className={style.select}
                        value={event.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                    >
                        <option value="">Select type</option>
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                    </select>
                    {errors.type && <p className={style.errorText}>{errors.type}</p>}
                </div>

                <div className={style.field}>
                    <label className={style.label}>Start Date & Time</label>
                    <input
                        className={`${style.input} ${errors.startDateTime ? style.invalid : ''}`}
                        type="datetime-local"
                        value={event.startDateTime}
                        onChange={(e) => handleChange('startDateTime', e.target.value)}
                    />
                    {errors.startDateTime && (
                        <p className={style.errorText}>{errors.startDateTime}</p>
                    )}
                </div>

                <div className={style.field}>
                    <label className={style.label}>End Date & Time</label>
                    <input
                        className={`${style.input} ${errors.endDateTime ? style.invalid : ''}`}
                        type="datetime-local"
                        value={event.endDateTime}
                        onChange={(e) => handleChange('endDateTime', e.target.value)}
                    />
                    {errors.endDateTime && <p className={style.errorText}>{errors.endDateTime}</p>}
                </div>

                <div className={style.field}>
                    <label className={style.label}>Add Recurring</label>
                    <select
                        className={style.select}
                        value={event.isRecurring ? 'yes' : 'no'}
                        onChange={(e) => handleChange('isRecurring', e.target.value === 'yes')}
                    >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>

                {event.isRecurring && (
                    <>
                        <div className={style.field}>
                            <label className={style.label}>Frequency</label>
                            <select
                                className={style.select}
                                value={event.recurrenceRule?.frequency ?? ''}

                                onChange={(e) =>
                                    handleRecurrenceChange('frequency', e.target.value)
                                }
                            >
                                <option value="">Select frequency</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            {errors.recurrenceRule?.frequency && (
                                <p className={style.errorText}>{errors.recurrenceRule.frequency}</p>
                            )}
                        </div>

                        <div className={style.field}>
                            <label className={style.label}>
                                Interval (e.g. every X days/weeks/months)
                            </label>
                            <input
                                className={`${style.input} ${errors.recurrenceRule?.interval ? style.invalid : ''
                                    }`}
                                type="number"
                                min={1}
                                value={event.recurrenceRule?.interval}
                                onChange={(e) =>
                                    handleRecurrenceChange('interval', Number(e.target.value))
                                }
                            />
                            {errors.recurrenceRule?.interval && (
                                <p className={style.errorText}>{errors.recurrenceRule.interval}</p>
                            )}
                        </div>
                    </>
                )}

                <button type="submit" className={style.buttonSubmit}>
                    Create
                </button>
            </fieldset>
        </form>
    );
};

export default EventForm;
