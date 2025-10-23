const express = require('express');
const {body, validationResult} = require('express-validator');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const {auth, checkWorkspaceAccess, checkPermission} = require('../middleware/auth');
const {sendWorkspaceInvitation} = require("../services/emailService");
const Invitation = require('../models/Invitation');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Workspace:
 *       type: object
 *       required:
 *         - name
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the workspace
 *         name:
 *           type: string
 *           description: The workspace name
 *         description:
 *           type: string
 *           description: The workspace description
 *         owner:
 *           type: string
 *           description: The ID of the workspace owner
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, member, guest]
 *               joinedAt:
 *                 type: string
 *                 format: date-time
 *         settings:
 *           type: object
 *           properties:
 *             isPublic:
 *               type: boolean
 *             allowMemberInvites:
 *               type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Get all workspaces for the authenticated user
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workspaces retrieved successfully
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
 *                     $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            $or: [
                {owner: req.user.userId},
                {'members.user': req.user.userId}
            ],
            isActive: true
        })
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .sort({updatedAt: -1});

        res.json({
            success: true,
            message: 'Workspaces retrieved successfully',
            data: workspaces
        });
    } catch (error) {
        console.error('Get workspaces error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving workspaces'
        });
    }
});

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Workspace
 *               description:
 *                 type: string
 *                 example: A collaborative workspace for our team
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["development", "design"]
 *               settings:
 *                 type: object
 *                 properties:
 *                   isPublic:
 *                     type: boolean
 *                   allowMemberInvites:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Workspace created successfully
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
 *                   $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', auth, [
    body('name').trim().isLength({min: 2, max: 100}).withMessage('Workspace name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({max: 500}).withMessage('Description cannot exceed 500 characters')
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

        const {name, description, tags, settings} = req.body;

        const workspace = new Workspace({
            name,
            description,
            owner: req.user.userId,
            tags: tags || [],
            settings: {
                isPublic: settings?.isPublic || false,
                allowMemberInvites: settings?.allowMemberInvites !== false,
                ...settings
            }
        });

        // Add owner as admin member
        workspace.members.push({
            user: req.user.userId,
            role: 'admin'
        });

        await workspace.save();

        // Populate the workspace data
        await workspace.populate([
            {path: 'owner', select: 'name email avatar'},
            {path: 'members.user', select: 'name email avatar'}
        ]);

        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            data: workspace
        });
    } catch (error) {
        console.error('Create workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating workspace'
        });
    }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace retrieved successfully
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
 *                   $ref: '#/components/schemas/Workspace'
 *       404:
 *         description: Workspace not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, checkWorkspaceAccess, async (req, res) => {
    try {
        const data = await req.workspace.populate([
            {path: 'owner', select: 'name email avatar'},
            {path: 'members.user', select: 'name email avatar'}
        ]);
        console.log(data);
        res.json({
            success: true,
            message: 'Workspace retrieved successfully',
            data: data
        });
    } catch (error) {
        console.error('Get workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving workspace'
        });
    }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: Update workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workspace updated successfully
 *       403:
 *         description: Access denied (only owner/admin can update)
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, checkWorkspaceAccess, [
    body('name').optional().trim().isLength({
        min: 2,
        max: 100
    }).withMessage('Workspace name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({max: 500}).withMessage('Description cannot exceed 500 characters')
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

        // Check if user has permission to update (owner or admin)
        const isOwner = req.workspace.owner.toString() === req.user.userId;
        const userRole = req.workspace.getUserRole(req.user.userId);

        if (!isOwner && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only owner or admin can update workspace.'
            });
        }

        const {name, description, tags, settings} = req.body;
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (tags !== undefined) updateData.tags = tags;
        if (settings !== undefined) updateData.settings = {...req.workspace.settings, ...settings};

        const workspace = await Workspace.findByIdAndUpdate(
            req.params.id,
            updateData,
            {new: true, runValidators: true}
        ).populate([
            {path: 'owner', select: 'name email avatar'},
            {path: 'members.user', select: 'name email avatar'}
        ]);

        res.json({
            success: true,
            message: 'Workspace updated successfully',
            data: workspace
        });
    } catch (error) {
        console.error('Update workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating workspace'
        });
    }
});

/**
 * @swagger
 * /api/workspaces/{id}/members:
 *   post:
 *     summary: Invite member to workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
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
 *                 example: user@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, member, guest]
 *                 default: member
 *     responses:
 *       200:
 *         description: Member invited successfully
 *       400:
 *         description: User not found or already a member
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/:id/members', auth, checkWorkspaceAccess, [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['admin', 'member', 'guest']).withMessage('Invalid role')
], async (req, res) => {
    try {
        console.log(req.user);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Check if user has permission to invite (owner or admin)
        const isOwner = req.workspace.owner.toString() === req.user.userId;
        const userRole = req.workspace.getUserRole(req.user.userId);

        if (!isOwner && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only owner or admin can invite members.'
            });
        }

        const { email, role = 'member' } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            // If user does not exist, create invitation and send email
            try {
                // Check if invitation already exists
                const existingInvitation = await Invitation.findOne({
                    email,
                    workspace: req.workspace._id,
                    type: 'workspace',
                    status: 'pending'
                });

                if (existingInvitation) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invitation already sent to this email.'
                    });
                }

                // Create invitation
                const invitation = new Invitation({
                    email,
                    role,
                    type: 'workspace',
                    workspace: req.workspace._id,
                    invitedBy: req.user.userId,
                    token: require('crypto').randomBytes(32).toString('hex'),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                });

                await invitation.save();

                // Send invitation email
                // In workspace members route, replace:
                const inviteLink = `${process.env.CLIENT_URL}/register?workspace=${req.workspace._id}&email=${encodeURIComponent(email)}`;
                sendWorkspaceInvitation(
                    email,
                    req.workspace.name,
                    req.user.name,
                    inviteLink
                );

                console.log('Workspace invitation email sent to non-existing user:', email);

                return res.json({
                    success: true,
                    message: 'User does not exist. Workspace invitation email sent.',
                    data: {
                        email,
                        role,
                        status: 'invited',
                        expiresAt: invitation.expiresAt
                    }
                });
            } catch (emailErr) {
                console.error('Failed to send workspace invitation email:', emailErr);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send workspace invitation email.'
                });
            }
        }

        // If user exists, check if already a member
        if (req.workspace.isMember(user._id)) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member of this workspace.'
            });
        }

        // Add member directly
        await req.workspace.addMember(user._id, role, req.user.userId);

        // Populate the updated workspace
        await req.workspace.populate([
            { path: 'owner', select: 'name email avatar' },
            { path: 'members.user', select: 'name email avatar' }
        ]);

        // Send notification email to existing user
        try {
            const workspaceLink = `${process.env.CLIENT_URL}/workspaces/${req.workspace._id}`;
            sendWorkspaceInvitation(
                user.email,
                req.workspace.name,
                req.user.name,
                workspaceLink
            );
            console.log('Workspace notification email sent to existing user:', user.email);
        } catch (emailErr) {
            console.error('Failed to send workspace notification email:', emailErr);
        }

        res.json({
            success: true,
            message: 'Member added successfully',
            data: req.workspace
        });
    } catch (error) {
        console.error('Add workspace member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding workspace member'
        });
    }
});


/**
 * @swagger
 * /api/workspaces/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
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
router.delete('/:id/members/:userId', auth, checkWorkspaceAccess, async (req, res) => {
    try {
        const {userId} = req.params;

        // Check if user has permission to remove members (owner or admin)
        const isOwner = req.workspace.owner.toString() === req.user.userId;
        const userRole = req.workspace.getUserRole(req.user.userId);

        if (!isOwner && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only owner or admin can remove members.'
            });
        }

        // Cannot remove owner
        if (req.workspace.owner.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove workspace owner.'
            });
        }

        // Cannot remove yourself
        if (req.user.userId === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove yourself. Leave workspace instead.'
            });
        }

        // Remove member
        await req.workspace.removeMember(userId);

        // Populate the updated workspace
        await req.workspace.populate([
            {path: 'owner', select: 'name email avatar'},
            {path: 'members.user', select: 'name email avatar'}
        ]);

        res.json({
            success: true,
            message: 'Member removed successfully',
            data: req.workspace
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing member'
        });
    }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   delete:
 *     summary: Delete workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace deleted successfully
 *       403:
 *         description: Access denied (only owner can delete)
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, checkWorkspaceAccess, async (req, res) => {
    try {
        // Only owner can delete workspace
        if (req.workspace.owner.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only workspace owner can delete the workspace.'
            });
        }

        // Soft delete by setting isActive to false
        req.workspace.isActive = false;
        await req.workspace.save();

        res.json({
            success: true,
            message: 'Workspace deleted successfully'
        });
    } catch (error) {
        console.error('Delete workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting workspace'
        });
    }
});

module.exports = router;
