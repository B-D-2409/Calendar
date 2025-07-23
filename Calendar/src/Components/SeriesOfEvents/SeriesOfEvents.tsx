import axios from "axios";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useState, useEffect, useContext, ChangeEvent, FormEvent } from "react";
import styles from "./SeriesOfEvents.module.css"
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

// --- Types ---

interface Time {
    hour: number;
    minute: number;
}

interface Location {
    address: string;
    city: string;
    country: string;
}

interface EventData {
    title: string;
    description: string;
    startDateTime: string;
    startTime: Time;
    endTime: Time;
    location: Location;
}

interface RecurrenceRule {
    frequency: string;
    endDate: string;
}

interface Series {
    name: string;
    seriesType: "recurring" | string;
    recurrenceRule: RecurrenceRule;
    eventsId: string[];
    isIndefinite: boolean;
    startingEvent: EventData;
    endingEvent: EventData;
}

interface ErrorState {
    [key: string]: string;
}

interface EventSeriesFormProps {
    onSeriesCreated?: (data: any) => void;
}

// --- Component ---

const EventSeriesForm: React.FC<EventSeriesFormProps> = ({ onSeriesCreated }) => {
    const { user } = useContext(AuthContext) as { user: { _id: string } };

    const [series, setSeries] = useState<Series>({
        name: "",
        seriesType: "recurring",
        recurrenceRule: {
            frequency: "weekly",
            endDate: "",
        },
        eventsId: [],
        isIndefinite: false,
        startingEvent: {
            title: "",
            description: "",
            startDateTime: "",
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 10, minute: 0 },
            location: { address: "", city: "", country: "" },
        },
        endingEvent: {
            title: "",
            description: "",
            startDateTime: "",
            startTime: { hour: 9, minute: 0 },
            endTime: { hour: 10, minute: 0 },
            location: { address: "", city: "", country: "" },
        },
    });

    const [events, setEvents] = useState<any[]>([]);
    const [errors, setErrors] = useState<ErrorState>({});
    const [successMessage, setSuccessMessage] = useState<string>("");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get(`${key}/api/events`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
                    },
                });
                setEvents(response.data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        fetchEvents();
    }, []);

    // Handlers with typed params

    const handleStartingEventChange = (field: keyof EventData, value: string) => {
        setSeries((prev) => ({
            ...prev,
            startingEvent: {
                ...prev.startingEvent,
                [field]: value,
            },
        }));
    };

    const handleStartingEventTimeChange = (
        timeType: "startTime" | "endTime",
        field: keyof Time,
        value: number | string
    ) => {
        setSeries((prev) => ({
            ...prev,
            startingEvent: {
                ...prev.startingEvent,
                [timeType]: {
                    ...prev.startingEvent[timeType],
                    [field]: typeof value === "string" ? parseInt(value, 10) : value,
                },
            },
        }));
    };

    const handleStartingEventLocationChange = (field: keyof Location, value: string) => {
        setSeries((prev) => ({
            ...prev,
            startingEvent: {
                ...prev.startingEvent,
                location: {
                    ...prev.startingEvent.location,
                    [field]: value,
                },
            },
        }));
    };

    const handleEndingEventChange = (field: keyof EventData, value: string) => {
        setSeries((prev) => ({
            ...prev,
            endingEvent: {
                ...prev.endingEvent,
                [field]: value,
            },
        }));
    };

    const handleEndingEventTimeChange = (
        timeType: "startTime" | "endTime",
        field: keyof Time,
        value: number | string
    ) => {
        setSeries((prev) => ({
            ...prev,
            endingEvent: {
                ...prev.endingEvent,
                [timeType]: {
                    ...prev.endingEvent[timeType],
                    [field]: typeof value === "string" ? parseInt(value, 10) : value,
                },
            },
        }));
    };

    const handleEndingEventLocationChange = (field: keyof Location, value: string) => {
        setSeries((prev) => ({
            ...prev,
            endingEvent: {
                ...prev.endingEvent,
                location: {
                    ...prev.endingEvent.location,
                    [field]: value,
                },
            },
        }));
    };

    const validate = (): boolean => {
        const newErrors: ErrorState = {};

        if (!series.name) {
            newErrors.name = "Series name is required";
        }
        if (!series.startingEvent.title) {
            newErrors.startingEventTitle = "Starting event title is required";
        }
        if (!series.startingEvent.description) {
            newErrors.startingEventDescription = "Starting event description is required";
        }
        if (!series.startingEvent.startDateTime) {
            newErrors.startingEventStart = "Starting event date is required";
        }
        if (!series.isIndefinite) {
            if (!series.endingEvent.title) {
                newErrors.endingEventTitle = "Ending event title is required";
            }
            if (!series.endingEvent.description) {
                newErrors.endingEventDescription = "Ending event description is required";
            }
            if (!series.endingEvent.startDateTime) {
                newErrors.endingEventStart = "Ending event date is required";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            const seriesData = {
                name: series.name,
                creatorId: user._id,
                seriesType: "recurring",
                isIndefinite: series.isIndefinite,
                startingEvent: series.startingEvent,
                endingEvent: series.isIndefinite ? undefined : series.endingEvent,
                recurrenceRule: series.seriesType === "recurring" ? series.recurrenceRule : undefined,
            };

            const response = await axios.post(`${key}/api/events/event-series`, seriesData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
                },
            });

            setSuccessMessage("Event series created successfully!");
            onSeriesCreated && onSeriesCreated(response.data);

            // Reset form
            setSeries({
                name: "",
                seriesType: "recurring",
                recurrenceRule: { frequency: "weekly", endDate: "" },
                eventsId: [],
                isIndefinite: false,
                startingEvent: {
                    title: "",
                    description: "",
                    startDateTime: "",
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    location: { address: "", city: "", country: "" },
                },
                endingEvent: {
                    title: "",
                    description: "",
                    startDateTime: "",
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    location: { address: "", city: "", country: "" },
                },
            });
        } catch (error) {
            setErrors({ general: "Failed to create event series" });
            console.error("Failed to create event series:", error);
        }
    };

    const generateTimeOptions = (type: "hour" | "minute") => {
        if (type === "hour") {
            return Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                </option>
            ));
        } else {
            return Array.from({ length: 12 }, (_, i) => (
                <option key={i * 5} value={i * 5}>
                    {(i * 5).toString().padStart(2, "0")}
                </option>
            ));
        }
    };

    // The JSX rendering part is not provided in your snippet,
    // but you can now use all typed handlers and state here.


    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <h2>Create Event Series</h2>

            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
            {errors.general && <p className={styles.errorMessage}>{errors.general}</p>}

            {/* Series Name */}
            <div className={styles.inputGroup}>
                <label>Series Name:</label>
                <input
                    type="text"
                    value={series.name}
                    onChange={(e) => setSeries({ ...series, name: e.target.value })}
                    required
                    className={styles.input}
                />
                {errors.name && <p className={styles.errorMessage}>{errors.name}</p>}
            </div>

            {/* Series Type */}
            <div className={styles.inputGroup}>
                <label>Series Type:</label>
                <select
                    value={series.seriesType}
                    onChange={(e) => setSeries({ ...series, seriesType: e.target.value })}
                    className={styles.input}
                >
                    <option value="recurring">Recurring (Automatic)</option>
                    {/* <option value="manual">Manual</option> */}
                </select>
            </div>

            {/* STARTING EVENT SECTION */}
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Starting Event</legend>

                <div className={styles.inputGroup}>
                    <label>Title:</label>
                    <input
                        type="text"
                        value={series.startingEvent.title}
                        onChange={(e) => handleStartingEventChange("title", e.target.value)}
                        required
                        className={styles.input}
                    />
                    {errors.startingEventTitle && <p className={styles.errorMessage}>{errors.startingEventTitle}</p>}
                </div>

                <div className={styles.inputGroup}>
                    <label>Description:</label>
                    <textarea
                        value={series.startingEvent.description}
                        onChange={(e) => handleStartingEventChange("description", e.target.value)}
                        required
                        className={styles.textarea}
                    />
                    {errors.startingEventDescription && <p className={styles.errorMessage}>{errors.startingEventDescription}</p>}
                </div>

                <div className={styles.inputGroup}>
                    <label>Start Date:</label>
                    <input
                        type="date"
                        value={series.startingEvent.startDateTime}
                        onChange={(e) => handleStartingEventChange("startDateTime", e.target.value)}
                        required
                        className={styles.input}
                    />
                    {errors.startingEventStart && <p className={styles.errorMessage}>{errors.startingEventStart}</p>}
                </div>

                <div className={styles.timeGroup}>
                    <div className={styles.timeInput}>
                        <label>Start Time:</label>
                        <div className={styles.timeSelectors}>
                            <select
                                value={series.startingEvent.startTime.hour}
                                onChange={(e) => handleStartingEventTimeChange("startTime", "hour", e.target.value)}
                                className={styles.timeSelect}
                            >
                                {generateTimeOptions("hour")}
                            </select>
                            <span className={styles.timeSeparator}>:</span>
                            <select
                                value={series.startingEvent.startTime.minute}
                                onChange={(e) => handleStartingEventTimeChange("startTime", "minute", e.target.value)}
                                className={styles.timeSelect}
                            >
                                {generateTimeOptions("minute")}
                            </select>
                        </div>
                    </div>

                    <div className={styles.timeInput}>
                        <label>End Time:</label>
                        <div className={styles.timeSelectors}>
                            <select
                                value={series.startingEvent.endTime.hour}
                                onChange={(e) => handleStartingEventTimeChange("endTime", "hour", e.target.value)}
                                className={styles.timeSelect}
                            >
                                {generateTimeOptions("hour")}
                            </select>
                            <span className={styles.timeSeparator}>:</span>
                            <select
                                value={series.startingEvent.endTime.minute}
                                onChange={(e) => handleStartingEventTimeChange("endTime", "minute", e.target.value)}
                                className={styles.timeSelect}
                            >
                                {generateTimeOptions("minute")}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Location (Optional):</label>
                    <input
                        type="text"
                        placeholder="Address"
                        value={series.startingEvent.location.address}
                        onChange={(e) => handleStartingEventLocationChange("address", e.target.value)}
                        className={`${styles.input} ${styles.mbSmall}`}
                    />
                    <input
                        type="text"
                        placeholder="City"
                        value={series.startingEvent.location.city}
                        onChange={(e) => handleStartingEventLocationChange("city", e.target.value)}
                        className={`${styles.input} ${styles.mbSmall}`}
                    />
                    <input
                        type="text"
                        placeholder="Country"
                        value={series.startingEvent.location.country}
                        onChange={(e) => handleStartingEventLocationChange("country", e.target.value)}
                        className={styles.input}
                    />
                </div>
            </fieldset>

            {/* Recurring Options */}
            {series.seriesType === "recurring" && (
                <div className={styles.inputGroup}>
                    <label>Frequency:</label>
                    <select
                        value={series.recurrenceRule.frequency}
                        onChange={(e) =>
                            setSeries({
                                ...series,
                                recurrenceRule: { ...series.recurrenceRule, frequency: e.target.value },
                            })
                        }
                        className={styles.input}
                    >
                        {/* <option value="daily">Daily</option> */}
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
            )}

            {/* Indefinite Checkbox */}
            <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                    <p className={styles.checkboxText}>Run series indefinitely:</p>
                    <input
                        type="checkbox"
                        checked={series.isIndefinite}
                        onChange={(e) => setSeries({ ...series, isIndefinite: e.target.checked })}
                        className={styles.checkbox}
                    />
                </label>
            </div>

            {/* ENDING EVENT SECTION */}
            {!series.isIndefinite && (
                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Ending Event</legend>

                    <div className={styles.inputGroup}>
                        <label>Title:</label>
                        <input
                            type="text"
                            value={series.endingEvent.title}
                            onChange={(e) => handleEndingEventChange("title", e.target.value)}
                            required
                            className={styles.input}
                        />
                        {errors.endingEventTitle && <p className={styles.errorMessage}>{errors.endingEventTitle}</p>}
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Description:</label>
                        <textarea
                            value={series.endingEvent.description}
                            onChange={(e) => handleEndingEventChange("description", e.target.value)}
                            required
                            className={styles.textarea}
                        />
                        {errors.endingEventDescription && <p className={styles.errorMessage}>{errors.endingEventDescription}</p>}
                    </div>

                    <div className={styles.inputGroup}>
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={series.endingEvent.startDateTime}
                            onChange={(e) => handleEndingEventChange("startDateTime", e.target.value)}
                            required
                            className={styles.input}
                        />
                        {errors.endingEventStart && <p className={styles.errorMessage}>{errors.endingEventStart}</p>}
                    </div>

                    <div className={styles.timeGroup}>
                        <div className={styles.timeInput}>
                            <label>Start Time:</label>
                            <div className={styles.timeSelectors}>
                                <select
                                    value={series.endingEvent.startTime.hour}
                                    onChange={(e) => handleEndingEventTimeChange("startTime", "hour", e.target.value)}
                                    className={styles.timeSelect}
                                >
                                    {generateTimeOptions("hour")}
                                </select>
                                <span className={styles.timeSeparator}>:</span>
                                <select
                                    value={series.endingEvent.startTime.minute}
                                    onChange={(e) => handleEndingEventTimeChange("startTime", "minute", e.target.value)}
                                    className={styles.timeSelect}
                                >
                                    {generateTimeOptions("minute")}
                                </select>
                            </div>
                        </div>

                        <div className={styles.timeInput}>
                            <label>End Time:</label>
                            <div className={styles.timeSelectors}>
                                <select
                                    value={series.endingEvent.endTime.hour}
                                    onChange={(e) => handleEndingEventTimeChange("endTime", "hour", e.target.value)}
                                    className={styles.timeSelect}
                                >
                                    {generateTimeOptions("hour")}
                                </select>
                                <span className={styles.timeSeparator}>:</span>
                                <select
                                    value={series.endingEvent.endTime.minute}
                                    onChange={(e) => handleEndingEventTimeChange("endTime", "minute", e.target.value)}
                                    className={styles.timeSelect}
                                >
                                    {generateTimeOptions("minute")}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Location (Optional):</label>
                        <input
                            type="text"
                            placeholder="Address"
                            value={series.endingEvent.location.address}
                            onChange={(e) => handleEndingEventLocationChange("address", e.target.value)}
                            className={`${styles.input} ${styles.mbSmall}`}
                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={series.endingEvent.location.city}
                            onChange={(e) => handleEndingEventLocationChange("city", e.target.value)}
                            className={`${styles.input} ${styles.mbSmall}`}
                        />
                        <input
                            type="text"
                            placeholder="Country"
                            value={series.endingEvent.location.country}
                            onChange={(e) => handleEndingEventLocationChange("country", e.target.value)}
                            className={styles.input}
                        />
                    </div>
                </fieldset>
            )}

            {/* Submit Button */}
            <button type="submit" className={styles.submitButton}>
                Save Series
            </button>
        </form>
    );

};

export default EventSeriesForm;
