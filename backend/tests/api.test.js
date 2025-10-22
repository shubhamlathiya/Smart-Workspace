const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server').app;
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Test database setup
const testDbUri = 'mongodb://localhost:27017/smart-workspace-test';

beforeAll(async () => {
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clean up test data before each test
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      await user.save();
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});

describe('Workspace API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create and login a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A test workspace'
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workspace.name).toBe(workspaceData.name);
      expect(response.body.data.workspace.createdBy).toBe(userId.toString());
    });

    it('should not create workspace without authentication', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A test workspace'
      };

      const response = await request(app)
        .post('/api/workspaces')
        .send(workspaceData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/workspaces', () => {
    beforeEach(async () => {
      // Create test workspaces
      const workspace1 = new Workspace({
        name: 'Workspace 1',
        description: 'First workspace',
        createdBy: userId,
        members: [userId]
      });

      const workspace2 = new Workspace({
        name: 'Workspace 2',
        description: 'Second workspace',
        createdBy: userId,
        members: [userId]
      });

      await Promise.all([workspace1.save(), workspace2.save()]);
    });

    it('should get user workspaces', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workspaces).toHaveLength(2);
    });
  });
});

describe('Project API', () => {
  let authToken;
  let userId;
  let workspaceId;

  beforeEach(async () => {
    // Create and login a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;

    // Create a test workspace
    const workspace = new Workspace({
      name: 'Test Workspace',
      description: 'A test workspace',
      createdBy: userId,
      members: [userId]
    });
    await workspace.save();
    workspaceId = workspace._id;
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        workspace: workspaceId
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(projectData.name);
      expect(response.body.data.project.createdBy).toBe(userId.toString());
    });
  });
});

describe('Task API', () => {
  let authToken;
  let userId;
  let workspaceId;
  let projectId;

  beforeEach(async () => {
    // Create and login a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;

    // Create test workspace and project
    const workspace = new Workspace({
      name: 'Test Workspace',
      description: 'A test workspace',
      createdBy: userId,
      members: [userId]
    });
    await workspace.save();
    workspaceId = workspace._id;

    const project = new Project({
      name: 'Test Project',
      description: 'A test project',
      workspace: workspaceId,
      createdBy: userId,
      members: [userId]
    });
    await project.save();
    projectId = project._id;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task',
        project: projectId,
        priority: 'medium',
        status: 'todo'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(taskData.title);
      expect(response.body.data.task.createdBy).toBe(userId.toString());
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  it('should handle server errors gracefully', async () => {
    // This would require mocking a database error
    // For now, just test the error response format
    const response = await request(app)
      .get('/api/workspaces')
      .expect(401); // No auth token

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
  });
});
