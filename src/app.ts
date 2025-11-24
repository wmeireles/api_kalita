import express from 'express';
import { dynamicCors } from './middlewares/dynamicCors';
import { ErrorHandlerMiddleware } from './middlewares/Errors';
import serviceFormRoutes from './routes/v1/serviceForm.routes';
import { setupSwagger } from './swagger';

export const app = express();

app.use(express.json());
app.use(dynamicCors);

// Swagger
setupSwagger(app);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Kalita Fotografia está online',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/service-form', serviceFormRoutes);

app.get('/', (req, res) => {
  res.send('API Kalita Fotografia está online');
});

app.use(ErrorHandlerMiddleware);
