const express = require('express')
const app = express();
require('dotenv').config()

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use(require('./routes/index'));


app.listen(process.env.PORT);
console.log(`Server on port ${process.env.PORT}`)