// const swaggerJsdoc = require('swagger-jsdoc');

// const options = {
//     definition: {
//       openapi: '3.0.0',
//       info: {
//         title: 'Community_APP',
//         version: '1.0.0',
//       },
//     },
//     apis: [{url: 'https://community-backend-954x.onrender.com'}], // files containing annotations as above
//   };

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Community_APP",
      version: "1.0.0",
    },
  },
  apis: [{ url: "https://community-backend-954x.onrender.com" }],
};

const openapiSpecification = swaggerJsdoc(options);
