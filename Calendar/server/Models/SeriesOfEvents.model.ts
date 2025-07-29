import mongoose from 'mongoose';
/**
 * Schema for location details.
 * @property {string} address - Street address.
 * @property {string} city - City name.
 * @property {string} country - Country name.
 */
const locationSchema = new mongoose.Schema({
    address: String,
    city: String,
    country: String
}, { _id: false });
/**
 * Schema for time representation of an event (hour and minute).
 * @property {number} hour - Hour of the day (0-23).
 * @property {number} minute - Minute of the hour (0-59).
 */

const eventTimeSchema = new mongoose.Schema({
    hour: {
        type: Number,
        required: true,
        min: 0,
        max: 23
    },
    minute: {
        type: Number,
        required: true,
        min: 0,
        max: 59
    }
}, { _id: false });

/**
 * Schema defining recurrence details for an event series.
 * @property {("daily" | "weekly" | "monthly" | "yearly")} frequency - Recurrence frequency.
 * @property {Date} [endDate] - Optional end date for the recurrence.
 */

const recurrenceSchema = new mongoose.Schema({
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true
    },
    endDate: {
        type: Date
    }
}, { _id: false });

/**
 * Schema representing a template for an event in a series.
 * @property {string} title - Title of the event template.
 * @property {string} description - Description of the event template.
 * @property {Date} startDateTime - Starting date and time of the event.
 * @property {Object} startTime - Time object representing start time (hour and minute).
 * @property {Object} endTime - Time object representing end time (hour and minute).
 * @property {Object} [location] - Location details of the event.
 */
const eventTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDateTime: {
        type: Date,
        required: true
    },
    startTime: {
        type: eventTimeSchema,
        required: true
    },
    endTime: {
        type: eventTimeSchema,
        required: true
    },
    location: {
        type: locationSchema
    }
}, { _id: false });

/**
 * Schema representing a series of events.
 * @property {string} name - Name of the event series.
 * @property {mongoose.Types.ObjectId} creatorId - Reference to the user who created the series.
 * @property {("recurring" | "manual")} seriesType - Type of the series.
 * @property {boolean} isIndefinite - Indicates if the series has no end.
 * @property {Object} startingEvent - Template for the starting event.
 * @property {Object} [endingEvent] - Template for the ending event (required if not indefinite).
 * @property {Object} [recurrenceRule] - Recurrence details (required if seriesType is 'recurring').
 * @property {mongoose.Types.ObjectId[]} eventsId - Array of references to individual events in the series.
 * @property {Date} createdAt - Timestamp of series creation.
 * @property {Date} updatedAt - Timestamp of last series update.
 */
const eventSeriesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seriesType: {
        type: String,
        enum: ['recurring', 'manual'],
        required: true,
        default: 'recurring'
    },
    isIndefinite: {
        type: Boolean,
        default: false
    },
    startingEvent: {
        type: eventTemplateSchema,
        required: true
    },
    endingEvent: {
        type: eventTemplateSchema,
        required: function() {
            return !this.isIndefinite;
        }
    },
    recurrenceRule: {
        type: recurrenceSchema,
        required: function() {
            return this.seriesType === 'recurring';
        }
    },
    eventsId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
}, {
    timestamps: true
});


export default mongoose.model('EventSeries', eventSeriesSchema);
