const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Options de base pour Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'DailyMeal API',
      version: '1.0.0',
      description: 'API pour recenser les plats du jour des restaurants u00e0 proximitu00e9',
      contact: {
        name: 'DailyMeal Team'
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Serveur de du00e9veloppement'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Chemins vers les fichiers contenant les annotations Swagger
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
