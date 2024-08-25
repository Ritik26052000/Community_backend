const express = require("express");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const userRoutes = require("./Routes/userRoutes");
const connectToDB = require("./configs/db");
const eventRouter = require("./Routes/eventRoutes");
const auth = require("./middlewares/auth");
const userRouter = require("./Routes/userRoutes");
const cors = require("cors");
const { swaggerUi, swaggerDocs } = require("./configs/jsdoc");
require("dotenv").config();

const Port = process.env.PORT;
const DB = process.env.MONGODB_URL;
const app = express();

//middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
// app.use(express.static( "views"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Routes

// app.use("/", (req, res)=>{
//     res.send('This is a Application')
// })

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));


app.use("/api", auth, eventRouter);
app.use("/users", userRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// console.log(Port)
app.listen(Port, async () => {
  try {
    connectToDB(DB);
    console.log("Successfully connected with database");
    console.log(`Server is running on http://localhost:${Port}`);
  } catch (err) {
    console.log(err);
  }
});
