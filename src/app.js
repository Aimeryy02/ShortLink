const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const rateLimiter = require('./config/rateLimit');
const routes = require('./routes');
const redirectRoutes = require('./routes/redirectRoutes');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'ShortLink API',
    endpoints: {
      health: '/health',
      links: '/api/links',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
  });
});

app.use('/api', rateLimiter);
app.use(routes);
app.use('/', redirectRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
