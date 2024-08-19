
const {Schema, model, default: mongoose} = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: String,
    data : Date,
    capacity: Number,
    attendees: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    ticketPrice : Number,
    dynamicPricing : Boolean,
    ratings: [Number],
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;