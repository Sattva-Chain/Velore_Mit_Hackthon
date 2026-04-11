const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { apiPrefix } = require('./config/env');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(apiPrefix, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
