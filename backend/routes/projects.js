const express = require('express');
const {body, validationResult} = require('express-validator');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Task = require('../models/Task');
const {auth, checkWorkspaceAccess, checkProjectAccess} = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - workspace
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the project
 *         name:
 *           type: string
 *           description: The project name
 *         description:
 *           type: string
 *           description: The project description
 *         workspace:
 *           type: string
 *           description: The workspace ID this project belongs to
 *         createdBy:
 *           type: string
 *           description: The user ID who created the project
 *         assignedMembers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [lead, member, observer]
 *         status:
 *           type: string
 *           enum: [planning, active, on-hold, completed, cancelled]
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
 *         completionPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspace
 *         schema:
 *           type: string
 *         description: Filter by workspace ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on-hold, completed, cancelled]
 *         description: Filter by project status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by project priority
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
    try {
        const {workspace, status, priority} = req.query;
        const filter = {isArchived: false};

        // Build filter based on query parameters
        if (workspace) {
            filter.workspace = workspace;
        }
        if (status) {
            filter.status = status;
        }
        if (priority) {
            filter.priority = priority;
        }

        // Find projects where user is either creator or assigned member
        const projects = await Project.find({
            ...filter, $or: [{createdBy: req.user.userId}, {'assignedMembers.user': req.user.userId}]
        })
            .populate('workspace', 'name')
            .populate('createdBy', 'name email avatar')
            .populate('assignedMembers.user', 'name email avatar')
            .sort({updatedAt: -1});

        res.json({
            success: true, message: 'Projects retrieved successfully', data: projects
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false, message: 'Server error retrieving projects'
        });
    }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - workspace
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mobile App Development
 *               description:
 *                 type: string
 *                 example: Developing a cross-platform mobile application
 *               workspace:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6789012345
 *               assignedMembers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [lead, member, observer]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["mobile", "react-native"]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied to workspace
 *       500:
 *         description: Server error
 */
router.post('/', auth, checkWorkspaceAccess, [body('name').trim().isLength({
    min: 2, max: 100
}).withMessage('Project name must be between 2 and 100 characters'), body('description').optional().trim().isLength({max: 1000}).withMessage('Description cannot exceed 1000 characters'), body('workspace').isMongoId().withMessage('Valid workspace ID is required'), body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, message: 'Validation failed', errors: errors.array()
            });
        }

        const {name, description, assignedMembers, priority, tags, dueDate} = req.body;


        const project = new Project({
            name,
            description,
            workspace: req.workspace._id,
            createdBy: req.user.userId,
            assignedMembers: assignedMembers || [],
            priority: priority || 'medium',
            tags: tags || [],
            dueDate: dueDate ? new Date(dueDate) : undefined
        });

        // Add creator as lead if not already assigned
        const creatorAssigned = project.assignedMembers.some(member => member.user.toString() === req.user.userId);

        if (!creatorAssigned) {
            project.assignedMembers.push({
                user: req.user.userId, role: 'lead'
            });
        }

        await project.save();

        // Populate the project data
        await project.populate([{path: 'workspace', select: 'name'}, {
            path: 'createdBy', select: 'name email avatar'
        }, {path: 'assignedMembers.user', select: 'name email avatar'}]);

        res.status(201).json({
            success: true, message: 'Project created successfully', data: project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false, message: 'Server error creating project'
        });
    }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID with tasks
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
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
 *                   allOf:
 *                     - $ref: '#/components/schemas/Project'
 *                     - type: object
 *                       properties:
 *                         tasks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, checkProjectAccess, async (req, res) => {
    try {
        // Get tasks for this project
        const tasks = await Task.find({
            project: req.project._id, isArchived: false
        })
            .populate('createdBy', 'name email avatar')
            .populate('assignedTo.user', 'name email avatar')
            .sort({createdAt: -1});

        // Get assigned members for this project
        const project = await req.project.populate('assignedMembers.user', 'name email avatar');

        // Add tasks to project object
        const projectWithDetails = {
            ...project.toObject(), tasks
        };

        res.json({
            success: true, message: 'Project retrieved successfully', data: projectWithDetails
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false, message: 'Server error retrieving project'
        });
    }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planning, active, on-hold, completed, cancelled]
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
 *               completionPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, checkProjectAccess, [body('name').optional().trim().isLength({
    min: 2, max: 100
}).withMessage('Project name must be between 2 and 100 characters'), body('description').optional().trim().isLength({max: 1000}).withMessage('Description cannot exceed 1000 characters'), body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']).withMessage('Invalid status'), body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'), body('completionPercentage').optional().isFloat({
    min: 0, max: 100
}).withMessage('Completion percentage must be between 0 and 100')], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, message: 'Validation failed', errors: errors.array()
            });
        }

        // Check if user has permission to update
        const isCreator = req.project.createdBy.toString() === req.user.userId;
        const isWorkspaceOwner = req.project.workspace.owner.toString() === req.user.userId;
        const userRole = req.project.getUserRole(req.user.userId);

        if (!isCreator && !isWorkspaceOwner && userRole !== 'lead') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only project creator, workspace owner, or project lead can update.'
            });
        }

        const updateData = {};
        const allowedFields = ['name', 'description', 'status', 'priority', 'tags', 'dueDate', 'completionPercentage'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'dueDate' && req.body[field]) {
                    updateData[field] = new Date(req.body[field]);
                } else {
                    updateData[field] = req.body[field];
                }
            }
        });

        const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
            new: true, runValidators: true
        }).populate([{path: 'workspace', select: 'name'}, {
            path: 'createdBy', select: 'name email avatar'
        }, {path: 'assignedMembers.user', select: 'name email avatar'}]);

        res.json({
            success: true, message: 'Project updated successfully', data: project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false, message: 'Server error updating project'
        });
    }
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add member to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 enum: [lead, member, observer]
 *                 default: member
 *     responses:
 *       200:
 *         description: Member added successfully
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: User not found or already assigned
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/:id/members', auth, checkProjectAccess, [body('email').isEmail().normalizeEmail().withMessage('Valid email is required'), body('role').optional().isIn(['lead', 'member', 'observer','guest']).withMessage('Invalid role')], async (req, res) => {
    try {
        console.log(req.body)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, message: 'Validation failed', errors: errors.array()
            });
        }

        // Check permissions
        const isCreator = req.project.createdBy.toString() === req.user.userId;
        const isWorkspaceOwner = req.project.workspace.owner.toString() === req.user.userId;
        const userRole = req.project.getUserRole(req.user.userId);

        if (!isCreator && !isWorkspaceOwner && userRole !== 'lead') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only project creator, workspace owner, or project lead can add members.'
            });
        }

        const {email, role = 'member'} = req.body;

        // Check if user already assigned
        const existingMember = req.project.assignedMembers.find(member => member.user && member.user.email === email);

        if (existingMember) {
            return res.status(400).json({
                success: false, message: 'User is already assigned to this project.'
            });
        }

        // Find user by email
        const User = require('../models/User');
        const user = await User.findOne({email});

        if (user) {
            // User exists - add directly
            if (req.project.isAssigned(user._id)) {
                return res.status(400).json({
                    success: false, message: 'User is already assigned to this project.'
                });
            }
            console.log(user)
            await req.project.addMember(user._id, role);
            console.log(req.project)
            if (!req.project.workspace.members.some(m => m.user.toString() === user._id.toString())) {
                req.project.workspace.members.push({
                    user: user._id,
                    role: 'member', // default role
                    invitedBy: req.user.userId,
                    joinedAt: new Date()
                });
                await req.project.workspace.save();
                console.log(`User ${email} added to workspace ${req.project.workspace.name}`);
            }


            await req.project.populate([
                {
                    path: 'workspace',
                    populate: {path: 'members.user', select: 'name email avatar'},
                    select: 'name members'
                },
                {path: 'createdBy', select: 'name email avatar'},
                {path: 'assignedMembers.user', select: 'name email avatar'}
            ]);

            return res.json({
                success: true,
                message: 'Member added successfully',
                data: req.project,
                userExists: true
            });
        } else {
            // User doesn't exist - send invitation email
            // const Invitation = require('../models/Invitation');
            //
            // const existingInvitation = await Invitation.findOne({
            //     email,
            //     project: req.project._id,
            //     status: 'pending'
            // });

            // if (existingInvitation) {
            //     return res.status(400).json({
            //         success: false,
            //         message: 'Invitation already sent to this email.'
            //     });
            // }

            // const invitation = new Invitation({
            //     email,
            //     role,
            //     type: 'project',
            //     project: req.project._id,
            //     workspace: req.project.workspace._id,
            //     invitedBy: req.user.userId,
            //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            // });

            // await invitation.save();

            // Generate link with project ID and email
            const inviteLink = `${process.env.CLIENT_URL}/register?project=${req.project._id}&email=${encodeURIComponent(email)}`;

            const emailService = require('../services/emailService');
            const inviter = await User.findById(req.user.userId);

            emailService.sendProjectInvitation(email, req.project.name, inviter.name, inviteLink);

            console.log(`Project invitation sent to ${email} for project ${req.project.name}`);

            return res.status(201).json({
                success: true, message: 'Invitation sent successfully', data: {
                    email, role, status: 'invited', type: 'project'
                }, userExists: false
            });
        }
    } catch (error) {
        console.error('Add project member error:', error);
        res.status(500).json({
            success: false, message: 'Server error adding project member'
        });
    }
});

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.delete('/:id/members/:userId', auth, checkProjectAccess, async (req, res) => {
    try {
        const {userId} = req.params;
        console.log(req.params)
        // Check if user has permission to remove members
        const isCreator = req.project.createdBy.toString() === req.user.userId;
        const isWorkspaceOwner = req.project.workspace.owner.toString() === req.user.userId;
        const userRole = req.project.getUserRole(req.user.userId);

        if (!isCreator && !isWorkspaceOwner && userRole !== 'lead') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only project creator, workspace owner, or project lead can remove members.'
            });
        }

        // Cannot remove project creator
        if (req.project.createdBy.toString() === userId) {
            return res.status(400).json({
                success: false, message: 'Cannot remove project creator.'
            });
        }

        // Remove member
        await req.project.removeMember(userId);

        await Task.updateMany({
            project: req.params.id, 'assignedTo.user': userId
        }, {$pull: {assignedTo: {user: userId}}});


        // Populate the updated project
        await req.project.populate([{path: 'workspace', select: 'name'}, {
            path: 'createdBy', select: 'name email avatar'
        }, {path: 'assignedMembers.user', select: 'name email avatar'}]);

        res.json({
            success: true, message: 'Member removed successfully', data: req.project
        });
    } catch (error) {
        console.error('Remove project member error:', error);
        res.status(500).json({
            success: false, message: 'Server error removing project member'
        });
    }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       403:
 *         description: Access denied (only creator or workspace owner can delete)
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, checkProjectAccess, async (req, res) => {
    try {
        // Only creator or workspace owner can delete project
        const isCreator = req.project.createdBy.toString() === req.user.userId;
        const isWorkspaceOwner = req.project.workspace.owner.toString() === req.user.userId;

        if (!isCreator && !isWorkspaceOwner) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only project creator or workspace owner can delete the project.'
            });
        }

        // Soft delete by setting isArchived to true
        req.project.isArchived = true;
        await req.project.save();

        // Also archive all tasks in this project
        await Task.updateMany({project: req.project._id}, {isArchived: true});

        res.json({
            success: true, message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false, message: 'Server error deleting project'
        });
    }
});

module.exports = router;
