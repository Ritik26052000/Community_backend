const { Router } = require("express");
const registerModel = require("../models/registerModel");
const role = require("../middlewares/role");

const eventRouter = Router();
let user;

// Retrieve list of all events with the number of attendees
eventRouter.get("/events", async (req, res) => {
  try {
    user = await registerModel.findOne({ email: req.user.email });
    console.log(user);
    if (user.role == "admin") {
      const events = await Event.find({}).populate("attendees", "name");
      const eventDetails = events.map((event) => ({
        name: event.name,
        attendeesCount: event.attendees.length,
      }));
      res.status(200).json(eventDetails);
    } else {
      const events = await Event.find({ userId: user._id }).populate(
        "attendees",
        "name"
      );
      const eventDetails = events.map((event) => ({
        name: event.name,
        attendeesCount: event.attendees.length,
      }));
      res.status(200).json(eventDetails);
    }
  } catch (err) {
    console.log(err);
  }
});

// Retrieve all events created by a specific user
eventRouter.get("/events/created/:userId", async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.params.userId });
    res.status(200).json(events);
  } catch (err) {
    console.log(err);
  }
});

// Retrieve all the events a specific user registered for, sorted by date
eventRouter.get("/events/registered/:userId", async (req, res) => {
  try {
    const events = await Event.find({ attendees: req.params.userId }).sort(
      "date"
    );
    res.status(200).json(events);
  } catch (err) {
    console.log(err);
  }
});

eventRouter.get("/events/capacity/:userId", async (req, res) => {
  try {
    const event = await Event.findBYId(req.params.eventId);
    const percentageFilled = (event.attendees.length / event.capacity) * 100;
    res.json({ percentageFilled });
  } catch (err) {
    console.log(err);
  }
});

eventRouter.get("/events/aggregate", async (req, res) => {
  try {
    const events = await Event.find();
    const aggregateData = events.map((event) => {
      const avgRating = event.ratings.length
        ? event.ratings.reduce((a, b) => a + b) / event.ratings.length
        : 0;
      return {
        name: event.name,
        attendeesCount: event.attendees.length,
        avgRating,
      };
    });
    res.json(aggregateData);
  } catch (err) {
    console.log(err);
  }
});

eventRouter.post("/events/register/:eventId", async (req, res) => {
  const event = await Event.findBYId(req.params.eventId);
  const userId = req.body.userId;

  if (event.attendees.includes(userId)) {
    return res
      .status(400)
      .json({ message: "user already register to the event" });
  }

  if (event.attendees.length >= event.capacity) {
    return res.status(400).json({ message: "Event is sold out" });
  }

  event.attendees.push(userId);

  if (event.dynamicPricing) {
    event.ticketPrice += 40;
  }

  await event.save();
  res.json({ message: "Registration successfull" });
});

eventRouter.delete("/events/:eventId", async (req, res) => {
  const event = await Event.findBYId(req.params.eventId);

  if (event.attendees.length > 0) {
    return res
      .status(400)
      .json({ message: "Event can not be cancelled as it has attendees" });
  }
  const dayBeforEvent =
    (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24);
  const x = 7;

  if (dayBeforEvent < x) {
    return res
      .status(400)
      .json({
        message: `event can not be cancelled due to it is with in the ${x} time limit`,
      });
  }

  await Event.findBYIdAndDelete(req.params.eventId);
  res.json({ message: "Event cancelled successfully" });
});

 eventRouter.post('/events/create',role(['organizer', 'admin']) , async(req, res)=>{
    try{
        const {name, date, capacity,ticketPrice,dynamicPricing } = req.body;
        const userId = req.user.id;
    }
    catch(err){

    }
})
module.exports = eventRouter;
