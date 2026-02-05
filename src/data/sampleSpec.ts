import type { OpenAPISpec } from '@/types/openapi';

export const sampleOpenAPISpec: OpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'Pet Store API',
    description: 'A sample Pet Store API to demonstrate the API Documentation UI. This API allows you to manage pets, orders, and users.',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@petstore.com',
      url: 'https://petstore.com/support',
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0',
    },
  },
  servers: [
    {
      url: 'https://api.petstore.com/v1',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.petstore.com/v1',
      description: 'Staging server',
    },
  ],
  tags: [
    {
      name: 'Pets',
      description: 'Everything about your Pets',
    },
    {
      name: 'Orders',
      description: 'Access to Petstore orders',
    },
    {
      name: 'Users',
      description: 'Operations about users',
    },
  ],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List all pets',
        description: 'Returns a paginated list of all available pets in the store. You can filter by status and tags.',
        tags: ['Pets'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of pets to return',
            required: false,
            schema: {
              type: 'integer',
              default: 20,
              example: 10,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of pets to skip for pagination',
            required: false,
            schema: {
              type: 'integer',
              default: 0,
              example: 0,
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by pet status',
            required: false,
            schema: {
              type: 'string',
              enum: ['available', 'pending', 'sold'],
              example: 'available',
            },
          },
        ],
        responses: {
          '200': {
            description: 'A list of pets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Pet',
                      },
                    },
                    total: {
                      type: 'integer',
                      example: 100,
                    },
                    limit: {
                      type: 'integer',
                      example: 20,
                    },
                    offset: {
                      type: 'integer',
                      example: 0,
                    },
                  },
                },
                example: {
                  data: [
                    { id: 1, name: 'Max', species: 'dog', status: 'available', price: 299.99 },
                    { id: 2, name: 'Whiskers', species: 'cat', status: 'available', price: 149.99 },
                  ],
                  total: 100,
                  limit: 20,
                  offset: 0,
                },
              },
            },
          },
          '400': {
            description: 'Invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createPet',
        summary: 'Create a new pet',
        description: 'Adds a new pet to the store inventory. Returns the created pet with its assigned ID.',
        tags: ['Pets'],
        requestBody: {
          required: true,
          description: 'Pet object to add to the store',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreatePetRequest',
              },
              example: {
                name: 'Buddy',
                species: 'dog',
                breed: 'Golden Retriever',
                age: 2,
                price: 499.99,
                tags: ['friendly', 'trained'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pet created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/pets/{petId}': {
      parameters: [
        {
          name: 'petId',
          in: 'path',
          description: 'The unique identifier of the pet',
          required: true,
          schema: {
            type: 'integer',
            example: 123,
          },
        },
      ],
      get: {
        operationId: 'getPetById',
        summary: 'Get a pet by ID',
        description: 'Returns detailed information about a specific pet, including its photos and medical history.',
        tags: ['Pets'],
        responses: {
          '200': {
            description: 'Pet details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
                example: {
                  id: 123,
                  name: 'Max',
                  species: 'dog',
                  breed: 'Labrador',
                  age: 3,
                  status: 'available',
                  price: 399.99,
                  tags: ['friendly', 'vaccinated'],
                  createdAt: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
          '404': {
            description: 'Pet not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      put: {
        operationId: 'updatePet',
        summary: 'Update a pet',
        description: 'Updates an existing pet\'s information. All fields are optional.',
        tags: ['Pets'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdatePetRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Pet updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          '404': {
            description: 'Pet not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      delete: {
        operationId: 'deletePet',
        summary: 'Delete a pet',
        description: 'Removes a pet from the store. This action is irreversible.',
        tags: ['Pets'],
        responses: {
          '204': {
            description: 'Pet deleted successfully',
          },
          '404': {
            description: 'Pet not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/orders': {
      get: {
        operationId: 'listOrders',
        summary: 'List all orders',
        description: 'Returns a list of all orders placed in the store.',
        tags: ['Orders'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by order status',
            schema: {
              type: 'string',
              enum: ['pending', 'approved', 'delivered', 'cancelled'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Order',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createOrder',
        summary: 'Place a new order',
        description: 'Creates a new order for one or more pets.',
        tags: ['Orders'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateOrderRequest',
              },
              example: {
                petId: 123,
                quantity: 1,
                shippingAddress: {
                  street: '123 Main St',
                  city: 'New York',
                  state: 'NY',
                  zipCode: '10001',
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '400': {
            description: 'Invalid order data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/orders/{orderId}': {
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          description: 'Unique order identifier',
          schema: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      ],
      get: {
        operationId: 'getOrderById',
        summary: 'Get order by ID',
        description: 'Returns details of a specific order.',
        tags: ['Orders'],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      patch: {
        operationId: 'updateOrderStatus',
        summary: 'Update order status',
        description: 'Updates the status of an existing order.',
        tags: ['Orders'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'approved', 'delivered', 'cancelled'],
                  },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
        },
      },
    },
    '/users': {
      post: {
        operationId: 'createUser',
        summary: 'Create a new user',
        description: 'Registers a new user in the system.',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
    },
    '/users/{userId}': {
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            example: 1,
          },
        },
      ],
      get: {
        operationId: 'getUserById',
        summary: 'Get user by ID',
        description: 'Returns user profile information.',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique pet identifier',
            example: 123,
          },
          name: {
            type: 'string',
            description: 'Pet name',
            example: 'Max',
          },
          species: {
            type: 'string',
            enum: ['dog', 'cat', 'bird', 'fish', 'other'],
            example: 'dog',
          },
          breed: {
            type: 'string',
            example: 'Labrador',
          },
          age: {
            type: 'integer',
            description: 'Age in years',
            example: 3,
          },
          status: {
            type: 'string',
            enum: ['available', 'pending', 'sold'],
            example: 'available',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 299.99,
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['friendly', 'vaccinated'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
          },
        },
        required: ['id', 'name', 'species', 'status'],
      },
      CreatePetRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Buddy',
          },
          species: {
            type: 'string',
            enum: ['dog', 'cat', 'bird', 'fish', 'other'],
          },
          breed: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
          price: {
            type: 'number',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['name', 'species'],
      },
      UpdatePetRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['available', 'pending', 'sold'],
          },
          price: {
            type: 'number',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          petId: {
            type: 'integer',
          },
          quantity: {
            type: 'integer',
          },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'delivered', 'cancelled'],
          },
          total: {
            type: 'number',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        properties: {
          petId: {
            type: 'integer',
          },
          quantity: {
            type: 'integer',
            default: 1,
          },
          shippingAddress: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
            },
          },
        },
        required: ['petId'],
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          name: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          name: {
            type: 'string',
          },
          password: {
            type: 'string',
            format: 'password',
          },
        },
        required: ['email', 'name', 'password'],
      },
      Error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Invalid input parameters',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme.',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication',
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
};
