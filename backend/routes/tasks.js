const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth, checkProjectAccess } = require('../middleware/auth');
const {sendTaskAssignment} = require("../services/emailService");
const User = require('../models/User');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - project
 *         - workspace
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           description: The task title
 *         description:
 *           type: string
 *           description: The task description
 *         project:
 *           type: string
 *           description: The project ID this task belongs to
 *         workspace:
 *           type: string
 *           description: The workspace ID this task belongs to
 *         createdBy:
 *           type: string
 *           description: The user ID who created the task
 *         assignedTo:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               assignedAt:
 *                 type: string
 *                 format: date-time
 *               assignedBy:
 *                 type: string
 *         status:
 *           type: string
 *           enum: [todo, in-progress, review, completed]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         estimatedHours:
 *           type: number
 *           minimum: 0
 *         actualHours:
 *           type: number
 *           minimum: 0
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               originalName:
 *                 type: string
 *               path:
 *                 type: string
 *               size:
 *                 type: number
 *               mimeType:
 *                 type: string
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               content:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               isEdited:
 *                 type: boolean
 *         subtasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: workspace
 *         schema:
 *           type: string
 *         description: Filter by workspace ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in-progress, review, completed]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by task priority
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const { project, workspace, status, priority, assignedTo } = req.query;
    const filter = { isArchived: false };

    // Build filter based on query parameters
    if (project) filter.project = project;
    if (workspace) filter.workspace = workspace;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter['assignedTo.user'] = assignedTo;

    // Find tasks where user is either creator or assigned
    const tasks = await Task.find({
      ...filter,
      $or: [
        { createdBy: req.user.userId },
        { 'assignedTo.user': req.user.userId }
      ]
    })
    .populate('project', 'name')
    .populate('workspace', 'name')
    .populate('createdBy', 'name email avatar')
    .populate('assignedTo.user', 'name email avatar')
        .populate({
          path: 'comments.user',   // populate the user for each comment
          select: 'name email avatar'
        })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving tasks'
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - project
 *             properties:
 *               title:
 *                 type: string
 *                 example: Implement user authentication
 *               description:
 *                 type: string
 *                 example: Create login and registration functionality
 *               project:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6789012345
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a1b2c3d4e5f6789012346"]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["frontend", "auth"]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0
 *                 example: 8
 *               subtasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     completed:
 *                       type: boolean
 *                       default: false
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied to project
 *       500:
 *         description: Server error
 */
router.post('/', auth, checkProjectAccess, [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Task title must be between 2 and 200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, assignedTo, priority, tags, dueDate, estimatedHours, subtasks } = req.body;

    const task = new Task({
      title,
      description,
      project: req.project._id,
      workspace: req.project.workspace._id,
      createdBy: req.user.userId,
      assignedTo: assignedTo ? assignedTo.map(userId => ({ user: userId, assignedBy: req.user.userId })) : [],
      priority: priority || 'medium',
      tags: tags || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours: estimatedHours || 0,
      subtasks: subtasks || []
    });

    await task.save();

    // Populate the task data
    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'workspace', select: 'name' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isArchived: false
    })
        .populate('project', 'name')
        .populate('workspace', 'name')
        .populate('createdBy', 'name email avatar')
        .populate('assignedTo.user', 'name email avatar')
        .populate({
          path: 'comments.user',   // populate the user for each comment
          select: 'name email avatar'
        });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    console.log(task)
    // Optionally, populate replies if your comment schema has nested replies
    if (task.comments && task.comments.length > 0) {
      await Task.populate(task.comments, {
        path: 'replies.user',
        select: 'name email avatar'
      });
    }

    // Check if user has access to this task
    const hasAccess = task.createdBy._id.toString() === req.user.userId ||
        task.assignedTo.some(assignment => assignment.user._id.toString() === req.user.userId) ||
        req.userDoc.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this task.'
      });
    }

    res.json({
      success: true,
      message: 'Task retrieved successfully',
      data: task
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving task'
    });
  }
});


/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, review, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0
 *               actualHours:
 *                 type: number
 *                 minimum: 0
 *               subtasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     completed:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Task title must be between 2 and 200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),
  body('actualHours').optional().isFloat({ min: 0 }).withMessage('Actual hours must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({ 
      _id: req.params.id, 
      isArchived: false 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to update
    const isCreator = task.createdBy.toString() === req.user.userId;
    const isAssigned = task.isAssigned(req.user.userId);
    const isAdmin = req.userDoc.role === 'admin';

    if (!isCreator && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only task creator, assigned users, or admin can update.'
      });
    }

    const updateData = {};
    const allowedFields = ['title', 'description', 'status', 'priority', 'tags', 'dueDate', 'estimatedHours', 'actualHours', 'subtasks'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'dueDate' && req.body[field]) {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'project', select: 'name' },
      { path: 'workspace', select: 'name' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' },
      { path: 'comments.user', select: 'name email avatar' }
    ]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   post:
 *     summary: Assign task to users
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a1b2c3d4e5f6789012346", "64a1b2c3d4e5f6789012347"]
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/:id/assign', auth, [
  body('userIds').isArray({ min: 1 }).withMessage('At least one user ID is required'),
  body('userIds.*').isMongoId().withMessage('Valid user IDs are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      isArchived: false
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to assign
    const isCreator = task.createdBy.toString() === req.user.userId;
    const isAssigned = task.isAssigned(req.user.userId);
    const isAdmin = req.userDoc.role === 'admin';

    if (!isCreator && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only task creator, assigned users, or admin can assign tasks.'
      });
    }

    const { userIds } = req.body;

    const newlyAssignedUsers = [];

    // Add new assignees
    for (const userId of userIds) {
      if (!task.isAssigned(userId)) {
        await task.addAssignee(userId, req.user.userId);
        newlyAssignedUsers.push(userId); // Collect newly added users
      }
    }

    // Populate the updated task
    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'workspace', select: 'name' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' }
    ]);

    // Send assignment emails
    for (const userId of newlyAssignedUsers) {
      const userDoc = await User.findById(userId).select('name email');
      if (userDoc?.email) {
        const taskLink = `${process.env.CLIENT_URL}/tasks/${task._id}`; // link to task in frontend
        sendTaskAssignment(
            userDoc.email,
            task.title,
            task.project.name,
            req.userDoc.name,
            taskLink
        );
      }
    }

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: task
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning task'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add comment to task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: This task is progressing well
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/:id/comments', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment content must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({ 
      _id: req.params.id, 
      isArchived: false 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to comment
    const hasAccess = task.createdBy.toString() === req.user.userId ||
                     task.assignedTo.some(assignment => assignment.user.toString() === req.user.userId) ||
                     req.userDoc.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this task.'
      });
    }

    const { content } = req.body;

    // Add comment
    await task.addComment(req.user.userId, content);

    // Populate the updated task
    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'workspace', select: 'name' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' },
      { path: 'comments.user', select: 'name email avatar' }
    ]);

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: task
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}/comments/{commentId}:
 *   put:
 *     summary: Update task comment
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/:id/comments/:commentId', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment content must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({ 
      _id: req.params.id, 
      isArchived: false 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can edit this comment (only comment author or admin)
    if (comment.user.toString() !== req.user.userId && req.userDoc.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only comment author or admin can edit comments.'
      });
    }

    const { content } = req.body;

    // Update comment
    await task.updateComment(req.params.commentId, content);

    // Populate the updated task
    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'workspace', select: 'name' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' },
      { path: 'comments.user', select: 'name email avatar' }
    ]);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating comment'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete task comment
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      isArchived: false 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can delete this comment (only comment author or admin)
    if (comment.user.toString() !== req.user.userId && req.userDoc.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only comment author or admin can delete comments.'
      });
    }

    // Delete comment
    await task.deleteComment(req.params.commentId);

    // Populate the updated task
    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'workspace', select: 'name' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' },
      { path: 'comments.user', select: 'name email avatar' }
    ]);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      data: task
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Access denied (only creator or admin can delete)
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      isArchived: false 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only creator or admin can delete task
    const isCreator = task.createdBy.toString() === req.user.userId;
    const isAdmin = req.userDoc.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only task creator or admin can delete the task.'
      });
    }

    // Soft delete by setting isArchived to true
    task.isArchived = true;
    await task.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
});

module.exports = router;
