const express = require("express");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const userModel = require("../models/userModel");
const registerModel = require("../models/registerModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const blackListModel = require("../models/blackListModel");

const userRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimeType);
    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb("Error: Image Only");
    }
  },
});

const upload = multer({ storage: storage });
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: profilePicture
 *         type: file
 *         description: The profile picture to upload.
 *       - in: formData
 *         name: name
 *         type: string
 *         description: The name of the user.
 *       - in: formData
 *         name: email
 *         type: string
 *         description: The email of the user.
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Bad request.
 */

userRouter.post("/signup", upload.single("profilePicture"), (req, res) => {
  try {
    const newUser = {
      name: req.body.name,
      email: req.body.email,
      profilePicture: req.body.path,
      additionalPictures: [],
    };
    userModel.createUser(newUser);
    res.redirect("/users");
  } catch (err) {
    res.status(400).send(err);
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users.
 *       400:
 *         description: Bad request.
 */

userRouter.get("/", (req, res) => {
  try {
    const users = userModel.getAllUsers();
    res.send(users);
  } catch (err) {
    res.status(400).send(err);
  }
});

/**
 * @swagger
 * /update/{id}:
 *   post:
 *     summary: Update a user's details
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID.
 *         schema:
 *           type: integer
 *       - in: formData
 *         name: profilePicture
 *         type: file
 *         description: The new profile picture to upload.
 *       - in: formData
 *         name: name
 *         type: string
 *         description: The new name of the user.
 *       - in: formData
 *         name: email
 *         type: string
 *         description: The new email of the user.
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       400:
 *         description: Bad request.
 */

userRouter.post("/update/:id", upload.single("profilePicture"), (req, res) => {
  try {
    const updatedUser = {
      name: req.body.name,
      email: req.body.email,
      profilePicture: req.file ? req.file.path : undefined,
    };
    if (!updatedUser.profilePicture) delete updatedUser.profilePicture;
    userModel.updateUser(parseInt(req.params.id), updatedUser);
    res.redirect("/users");
  } catch (err) {
    res.status(400).send(err);
  }
});

/**
 * @swagger
 * /delete/{id}:
 *   post:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       400:
 *         description: Bad request.
 */

userRouter.post("/delete/:id", (req, res) => {
  try {
    userModel.deleteUser(parseInt(req.params.id));
    res.redirect("/users");
  } catch (err) {
    res.status(400).send(err);
  }
});

/**
 * @swagger
 * /upload/{id}:
 *   post:
 *     summary: Upload additional pictures for a user
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID.
 *         schema:
 *           type: integer
 *       - in: formData
 *         name: additionalPictures
 *         type: array
 *         items:
 *           type: file
 *         description: Additional pictures to upload.
 *     responses:
 *       200:
 *         description: Pictures uploaded successfully.
 *       400:
 *         description: Bad request.
 */

userRouter.post(
  "/upload/:id",
  upload.array("additionalPictures", 5),
  (req, res) => {
    try {
      const user = userModel
        .getAllUsers()
        .find((user) => user.id === parseInt(req.params.id));
      const files = req.files.map((file) => file.path);
      user.additionalPictures = user.additionalPictures.concat(files);
      userModel.updateUser(parseInt(req.params.id), {
        additionalPictures: user.additionalPictures,
      });
      res.redirect("/users");
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Email already registered.
 *       500:
 *         description: Internal server error.
 */

userRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const check = await registerModel.findOne({ email: req.body.email });

    if (check) {
      return res
        .status(400)
        .json({ message: "this email is already registered try to login" });
    }
    bcrypt.hash(password, 5, async (err, hash) => {
      if (err) console.log(err);
      const user = await registerModel.create({
        username: username,
        email: email,
        password: hash,
      });
      res.status(201).json({ message: "user is registerd successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns token and role.
 *       400:
 *         description: Incorrect login details.
 *       500:
 *         description: Internal server error.
 */

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

  try {
    const check = await registerModel.findOne({ email: req.body.email });

    if (!check) {
      return res.status(400).json({
        message: "this email is not registered try to register yourself",
      });
    }
    bcrypt.compare(password, check.password, async (err, result) => {
      if (err) console.log(err);
      const payload = { email: check.email };
      if (result) {
        jwt.sign(payload, process.env.SECRET_KEY, (err, token) => {
          if (err) console.log(err);
          console.log(err);
          return res.status(200).json({ token: token, role: check.role });
        });
      } else {
        return res.status(400).json({
          message: "user info is not correct try to check the details",
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Log out a user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logout successful.
 *       500:
 *         description: Internal server error.
 */

userRouter.get("/logout", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.json({ message: "token header is not present" });
    }
    const token = header.split(" ")[1];
    const blacklist = await blackListModel.create({ token });
    res.status(200).json({ message: "user is logout successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = userRouter;
