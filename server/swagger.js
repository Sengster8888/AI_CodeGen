import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI CodeGen API',
      version: '1.0.0',
      description: 'API documentation for the AI CodeGen platform',
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/auth/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Serve the raw JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Configure Swagger UI to point to that JSON URL, which adds the download link/bar
  const options = {
    explorer: true,
    swaggerOptions: {
      url: '/api-docs.json'
    }
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));
};
