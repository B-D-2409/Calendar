import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    address: String,
    city: String,
    country: String
}, { _id: false });


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
