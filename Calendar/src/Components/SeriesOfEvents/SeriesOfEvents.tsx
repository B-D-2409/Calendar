import axios from "axios";
import { AuthContext, AuthContextType } from "../../Common/AuthContext";
import { useState, useEffect, useContext, ChangeEvent, FormEvent } from "react";
import styles from "./SeriesOfEvents.module.css"
const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

// --- Types ---

/**
 * Represents a time with hour and minute.
 * @typedef {Object} Time
 * @property {number} hour - Hour part of the time (0-23).
 * @property {number} minute - Minute part of the time (0-59).
 */
interface Time {
    hour: number;
    minute: number;
}

/**
 * Represents a location with address, city, and country.
 * @typedef {Object} Location
 * @property {string} address - Street address.
 * @property {string} city - City name.
 * @property {string} country - Country name.
 */
interface Location {
    address: string;
    city: string;
    country: string;
}

/**
 * Represents event details.
 * @typedef {Object} EventData
 * @property {string} title - Title of the event.
 * @property {string} description - Description of the event.
 * @property {string} startDateTime - Starting date and time as ISO string.
 * @property {Time} startTime - Start time object with hour and minute.
 * @property {Time} endTime - End time object with hour and minute.
 * @property {Location} location - Location object.
 */

interface EventData {
    title: string;
    description: string;
    startDateTime: string;
    startTime: Time;
    endTime: Time;
    location: Location;
}

/**
 * Represents recurrence rules for a series.
 * @typedef {Object} RecurrenceRule
 * @property {string} frequency - Recurrence frequency (e.g. 'weekly').
 * @property {string} endDate - Recurrence end date as ISO string.
 */

interface RecurrenceRule {
    frequency: string;
    endDate: string;
}

/**
 * Represents a series of events.
 * @typedef {Object} Series
 * @property {string} name - Name of the series.
 * @property {"recurring" | string} seriesType - Type of the series.
 * @property {RecurrenceRule} recurrenceRule - Recurrence rules.
 * @property {string[]} eventsId - Array of event IDs.
 * @property {boolean} isIndefinite - Whether the series has an indefinite end.
 * @property {EventData} startingEvent - Starting event data.
 * @property {EventData} endingEvent - Ending event data.
 */

interface Series {
    name: string;
    seriesType: "recurring" | string;
    recurrenceRule: RecurrenceRule;
    eventsId: string[];
    isIndefinite: boolean;
    startingEvent: EventData;
    endingEvent: EventData;
}

/**
 * Represents a dictionary of error messages keyed by field names.
 * @typedef {Object.<string, string>} ErrorState
 */
interface ErrorState {
    [key: string]: string;
}

/**
 * Props for EventSeriesForm component.
 * @typedef {Object} EventSeriesFormProps
 * @property {(data: any) => void} [onSeriesCreated] - Optional callback triggered when a series is successfully created.
 */
interface EventSeriesFormProps {
    onSeriesCreated?: (data: any) => void;
}

/**
 * React component for creating a series of recurring events.
 *
 * @param {EventSeriesFormProps} props - Component props.
 * @returns {JSX.Element}
 *
 * The component manages:
 * - Local state for series, events list, errors, and success message.
 * - Fetching existing events on mount.
 * - Handlers for updating form fields with proper typing.
 * - Validation logic for required fields.
 * - Submission logic that sends the series data to backend and resets form on success.
 */
const EventSeriesForm: React.FC<EventSeriesFormProps> = ({ onSeriesCreated }) => {

    /**
     * Retrieves the current user from the authentication context.
     * type {{ user: { _id: string } }}
     */
    const { user } = useContext(AuthContext) as { user: { _id: string } };

    /**
 * React state holding the event series data.
 * type {[Series, React.Dispatch<React.SetStateAction<Series>>]}
 */
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

    /**
 * React state holding the list of events fetched from the API.
 * type {[any[], React.Dispatch<React.SetStateAction<any[]>>]}
 */
    const [events, setEvents] = useState<any[]>([]);

    /**
 * React state holding error messages for validation.
 * type {[ErrorState, React.Dispatch<React.SetStateAction<ErrorState>>]}
 */
    const [errors, setErrors] = useState<ErrorState>({});

    /**
 * React state holding success message string.
 * type {[string, React.Dispatch<React.SetStateAction<string>>]}
 */
    const [successMessage, setSuccessMessage] = useState<string>("");


    /**
 * Fetch events from API and update events state.
 * Runs once on component mount.
 */
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


    /**
     * Handler for changes to the starting event's string fields.
     * @param {keyof EventData} field - The field name in startingEvent to update
     * @param {string} value - The new value to set
     */

    const handleStartingEventChange = (field: keyof EventData, value: string) => {
        setSeries((prev) => ({
            ...prev,
            startingEvent: {
                ...prev.startingEvent,
                [field]: value,
            },
        }));
    };

    /**
 * Handler for changing starting event time fields (hour/minute).
 * @param {"startTime" | "endTime"} timeType - Whether to update startTime or endTime
 * @param {keyof Time} field - The time field ("hour" or "minute") to update
 * @param {number | string} value - The new value, number or string (converted to number)
 */
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

    /**
 * Handler for changing location fields of the starting event.
 * @param {keyof Location} field - The location field to update (address, city, country)
 * @param {string} value - The new string value
 */
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


    /**
 * Handler for changes to the ending event's string fields.
 * @param {keyof EventData} field - The field name in endingEvent to update
 * @param {string} value - The new value to set
 */
    const handleEndingEventChange = (field: keyof EventData, value: string) => {
        setSeries((prev) => ({
            ...prev,
            endingEvent: {
                ...prev.endingEvent,
                [field]: value,
            },
        }));
    };

    /**
 * Handler for changing ending event time fields (hour/minute).
 * @param {"startTime" | "endTime"} timeType - Whether to update startTime or endTime
 * @param {keyof Time} field - The time field ("hour" or "minute") to update
 * @param {number | string} value - The new value, number or string (converted to number)
 */
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

    /**
 * Handler for changing location fields of the ending event.
 * @param {keyof Location} field - The location field to update (address, city, country)
 * @param {string} value - The new string value
 */
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


    /**
     * Validates the current series form data.
     * @returns {boolean} True if valid, false otherwise
     */
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

    /**
 * Handles the form submission event.
 * Validates, then posts the series data to the backend.
 * @param {React.FormEvent} e - The form submit event
 */
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


    /**
     * Generates JSX <option> elements for time selection dropdowns.
     * @param {"hour" | "minute"} type - Whether to generate options for hours or minutes
     * @returns {JSX.Element[]} Array of option elements for the select input
     */
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
                                recurrenceRule: {
                                    ...series.recurrenceRule,
                                    frequency: e.target.value,
                                },
                            })
                        }
                        className={styles.input}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option> {/* Added daily option */}
                        <option value="monthly">Monthly</option> {/* Added monthly option */}
                        <option value="yearly">Yearly</option> {/* Added yearly option */}
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
