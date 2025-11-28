import express from 'express';
import { dynamicCors } from './middlewares/dynamicCors';
import { ErrorHandlerMiddleware } from './middlewares/Errors';
import {
  securityHeaders,
  rateLimits,
  attackDetection,
} from './middlewares/security';
import { xssSanitizer } from './middlewares/xssSanitizer';
import serviceFormRoutes from './routes/v1/serviceForm.routes';
import portfolioRoutes from './routes/v1/portfolio.routes';
import uploadRoutes from './routes/v1/upload.routes';
import { setupSwagger } from './swagger';

export const app = express();

// Middlewares de segurança (aplicados globalmente)
app.use(securityHeaders);
app.use(rateLimits.general);
app.use(attackDetection);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(dynamicCors);

// Sanitização XSS global
app.use(xssSanitizer());

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
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('API Kalita Fotografia está online');
});

app.use(ErrorHandlerMiddleware);
