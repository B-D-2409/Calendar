import mongoose from "mongoose";
/**
 * Schema to define recurrence details for an event.
 * @property {("daily" | "weekly" | "monthly")} frequency - How often the event recurs.
 * @property {number} interval - The interval between recurrences (default is 1).
 * @property {Date} [endDate] - The date when recurrence ends.
 */
const recurrenceSchema = new mongoose.Schema(
    {
        frequency: {
            type: String,
            enum: ["daily", "weekly", "monthly"],
        },
        interval: {
            type: Number,
            default: 1,
        },
        endDate: {
            type: Date,
        },
    },
    { _id: false }
);

/**
 * Schema representing an Event.
 * @property {string} title - Title of the event.
 * @property {string} description - Description of the event.
 * @property {string} type - Type/category of the event.
 * @property {Date} startDateTime - Start date and time of the event.
 * @property {Date} endDateTime - End date and time of the event.
 * @property {mongoose.Types.ObjectId} [creator] - Reference to the user who created the event.
 * @property {mongoose.Types.ObjectId[]} invitations - List of user IDs invited to the event.
 * @property {mongoose.Types.ObjectId} userId - Reference to the user who owns the event.
 * @property {string} [coverPhoto] - URL or path to the event's cover photo.
 * @property {Object} location - Location details of the event.
 * @property {string} location.address - Address of the event.
 * @property {string} location.city - City where the event takes place.
 * @property {string} location.country - Country where the event takes place.
 * @property {mongoose.Types.ObjectId[]} participants - List of participants' user IDs.
 * @property {boolean} isRecurring - Flag indicating if the event recurs.
 * @property {Object} [recurrenceRule] - Recurrence rule object following recurrenceSchema.
 * @property {string} [seriesId] - Identifier for recurring event series.
 * @property {Date} createdAt - Timestamp of event creation.
 * @property {Date} updatedAt - Timestamp of last event update.
 */


const eventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true },
        startDateTime: { type: Date, required: true },
        endDateTime: { type: Date, required: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false},
        invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        coverPhoto: { type: String },
        location: {
            address: String,
            city: String,
            country: String,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurrenceRule: {
            type: recurrenceSchema,
            default: null,
        },
        seriesId: {
            type: String,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
