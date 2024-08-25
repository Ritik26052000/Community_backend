const { Router } = require("express");
const registerModel = require("../models/registerModel");
const role = require("../middlewares/role");
const Event = require("../models/eventModel");

const eventRouter = Router();
let user;

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API for managing events
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Retrieve a list of all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal Server Error.
 */

// Retrieve list of all events with the number of attendees
eventRouter.get("/events", async (req, res) => {
  try {
    user = await registerModel.findOne({ email: req.user.email });
    if (user.role) {
      // if (user.role === "admin" || user.role === "organizer") {
      const events = await Event.find({});
      // const eventDetails = events.map((event) => ({
      //   name: event.name,
      //   attendeesCount: event.attendees.length,
      // }));
      res.status(200).json(events);
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

/**
 * @swagger
 * /events/created/{userId}:
 *   get:
 *     summary: Retrieve all events created by a specific user
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of events created by the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal Server Error.
 */

// Retrieve all events created by a specific user
eventRouter.get("/events/created/:userId", async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.params.userId });
    res.status(200).json(events);
  } catch (err) {
    console.log(err);
  }
});

/**
 * @swagger
 * /events/registered/{userId}:
 *   get:
 *     summary: Retrieve all the events a specific user registered for, sorted by date
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of events the user is registered for
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */

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

/**
 * @swagger
 * /events/capacity/{userId}:
 *   get:
 *     summary: Retrieve the percentage of event capacity filled
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event
 *     responses:
 *       200:
 *         description: Percentage of event capacity filled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 percentageFilled:
 *                   type: number
 */

eventRouter.get("/events/capacity/:userId", async (req, res) => {
  try {
    const event = await Event.findBYId(req.params.eventId);
    const percentageFilled = (event.attendees.length / event.capacity) * 100;
    res.json({ percentageFilled });
  } catch (err) {
    console.log(err);
  }
});

/**
 * @swagger
 * /events/aggregate:
 *   get:
 *     summary: Retrieve aggregate data for all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Aggregate event data including average rating
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   attendeesCount:
 *                     type: integer
 *                   avgRating:
 *                     type: number
 */

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

/**
 * @swagger
 * /events/register/{eventId}:
 *   post:
 *     summary: Register a user for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event to register for
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: User already registered or event is sold out
 */

eventRouter.post("/events/register/:eventId", async (req, res) => {
  console.log(req.params.eventId);
  const event = await Event.findById(req.params.eventId);
  const userId = user._id;

  if (event.attendees.includes(userId)) {
    return res
      .status(400)
      .json({ message: "user already register to the event" });
  }

  if (event.attendees.length >= event.capacity) {
    return res.status(400).json({ message: "Event is sold out" });
  }

  event.attendees.push(userId);

  console.log(event.attendees);

  if (event.dynamicPricing) {
    event.ticketPrice += 40;
  }

  await event.save();
  res.json({ message: "Registration successfull" });
});

/**
 * @swagger
 * /events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event to delete
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Event cannot be cancelled
 */

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
    return res.status(400).json({
      message: `event can not be cancelled due to it is with in the ${x} time limit`,
    });
  }

  await Event.findBYIdAndDelete(req.params.eventId);
  res.json({ message: "Event cancelled successfully" });
});

/**
 * @swagger
 * /events/create:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           format: JWT
 *         description: JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *               - capacity
 *               - ticketPrice
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the event
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of the event
 *               capacity:
 *                 type: integer
 *                 description: The maximum number of attendees
 *               ticketPrice:
 *                 type: number
 *                 description: The price of a ticket
 *               dynamicPricing:
 *                 type: boolean
 *                 description: Whether the event has dynamic pricing
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event created Successfully
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Missing required fields or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Internal Server Error
 */

eventRouter.post(
  "/events/create",
  role(["organizer", "admin"]),
  async (req, res) => {
    try {
      const { name, date, capacity, ticketPrice, dynamicPricing } = req.body;
      const user_email = req.user.email;
      const userData = await registerModel.findOne({ email: user_email });
      const userId = userData._id;

      console.log("143 eventroutes", userId);

      if (!name || !date || !capacity || !ticketPrice) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (isNaN(capacity) || capacity <= 0) {
        return res
          .status(400)
          .json({ message: "Capacity must be a positive number" });
      }

      if (isNaN(ticketPrice) || ticketPrice < 0) {
        return res
          .status(400)
          .json({ message: "Ticket price must be a non-negative number" });
      }

      const newEvent = new Event({
        name,
        date,
        capacity,
        ticketPrice,
        dynamicPricing,
        createdBy: userId,
      });

      await newEvent.save();

      res
        .status(201)
        .json({ message: "Event created Successfully", event: newEvent });
    } catch (err) {
      console.error("Error creating event:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

/**
 * @swagger
 * /events/{eventId}:
 *   get:
 *     summary: Get details of a specific event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the event to retrieve
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event not found
 *       500:
 *         description: Internal Server Error
 */

eventRouter.get("/events/:eventId", async (req, res) => {
  try {
    // Extract eventId from URL parameters
    const { eventId } = req.params;

    // Find the event by its ID
    const event = await Event.findById(eventId);

    // Check if the event exists
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Send the event details as the response
    res.status(200).json(event);
  } catch (err) {
    // Log error and send internal server error response
    console.error("Error fetching event details:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = eventRouter;
