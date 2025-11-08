import request from 'supertest';
import app from './server.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Test student data
const testStudent = {
  name: 'Test Student',
  email: 'test@student.com',
  password: 'testpass123',
  phone: '1234567890',
  address: 'Test Address'
};

// Helper function to generate auth token
const generateAuthToken = (studentId) => {
  return jwt.sign({ studentId }, JWT_SECRET);
};

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Clear test data before running tests
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  });

  test('POST /api/auth/register should register a new student', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testStudent);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  test('POST /api/auth/login should login an existing student', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});

describe('Student API Tests', () => {
  let authToken;
  let studentId;

  beforeAll(async () => {
    // Create a test student and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send(testStudent);
    
    authToken = response.body.token;
    studentId = response.body.student._id;
  });

  test('GET /api/students/profile should return student profile', async () => {
    const response = await request(app)
      .get('/api/students/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.student.email).toBe(testStudent.email);
  });

  test('GET /api/students/profile without auth should fail', async () => {
    const response = await request(app)
      .get('/api/students/profile');
    
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('Subscription Tests', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password
      });
    
    authToken = response.body.token;
  });

  test('GET /api/subscriptions should list available subscriptions', async () => {
    const response = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('Order Tests', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password
      });
    
    authToken = response.body.token;
  });

  test('GET /api/orders/student should list student orders', async () => {
    const response = await request(app)
      .get('/api/orders/student')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

afterAll(async () => {
  // Clean up the database after all tests
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});