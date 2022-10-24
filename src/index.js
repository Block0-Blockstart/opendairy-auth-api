const port = process.env.PORT || 42001;
const env = process.env.NODE_ENV || 'development';
const origin = process.env.ORIGIN || '*';

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const cookieParser = require('cookie-parser');
const authController = require('./auth/auth.controller');

const corsOptions = {
  origin,
  methods: 'GET, POST', // OPTIONS is always accepted for preflight requests
  credentials: true,
  /* if allowedHeaders is not specified, cors lib will populate Access-Control-Allow-Headers by reflecting
     all the headers specified in the request's Access-Control-Request-Headers header.
     So, we can ignore this options, except if we really want to control what header is acceptable.
   */
  // allowedHeaders: 'Content-Type',
};

const app = express();

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate logs daily
  path: path.join(__dirname, '..', 'logs'),
});

app.use(helmet()); // https://geshan.com.np/blog/2021/01/nodejs-express-helmet/
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env === 'development') {
  app.use(
    morgan('dev', {
      // outputs logs to console if status code >= 400
      skip: function (req, res) {
        return res.statusCode < 400;
      },
    })
  );
}
app.use(morgan('common', { stream: accessLogStream })); // outputs all logs to local log file

//Enabling CORS Pre-Flight for complex requests
// app.options('*', cors(corsOptions)); This should not be required because we use cors() at app level

app.use('/auth', authController);

app.use((req, res) => {
  res.status(404).send({ message: req.originalUrl + 'not found' });
});

app.listen(port, () => console.log(`Server is listenning on port ${port}`));
