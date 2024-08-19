const jwt = require("jsonwebtoken");
require("dotenv").config();

const auth = (req, res, next) => {
  console.log("auth code");
  const header = req._headers;
  console.log(header)
  if (!header) {
    return res.json({ message: "token header is not present" });
  }

  const token = header.split(" ")[1];
  let decode = jwt.verify(token, process.env.SECRET_KEY);

  if (!decode) {
    return res.json({ message: "this is not a valid token" });
  } else {
    next();
  }
};

module.exports = auth;
