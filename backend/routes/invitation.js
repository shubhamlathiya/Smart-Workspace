// routes/invitationRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Verify invitation token
router.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Invitation token is required'
            });
        }

        const invitation = await Invitation.findValidInvitation(token);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        const user = await User.findOne({ email: invitation.email });

        res.json({
            success: true,
            data: {
                type: invitation.type,
                email: invitation.email,
                role: invitation.role,
                project: invitation.project,
                workspace: invitation.workspace,
                invitedBy: invitation.invitedBy,
                expiresAt: invitation.expiresAt,
                userExists: !!user
            }
        });
    } catch (error) {
        console.error('Verify invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error verifying invitation'
        });
    }
});

// Accept invitation
router.post('/accept', [
    body('token').notEmpty().withMessage('Token is required')
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

        const { token } = req.body;

        const invitation = await Invitation.findValidInvitation(token);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Find user (user should be logged in at this point)
        const User = require('../models/User');
        const user = await User.findOne({ email: invitation.email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User account not found. Please make sure you are logged in with the correct email.'
            });
        }

        let result;

        if (invitation.type === 'project') {
            // Handle project invitation
            const project = await Project.findById(invitation.project);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            // Check if user is already in project
            if (project.isAssigned(user._id)) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already a member of this project'
                });
            }

            // Add user to project
            await project.addMember(user._id, invitation.role);

            // Populate project data for response
            await project.populate([
                { path: 'workspace', select: 'name' },
                { path: 'createdBy', select: 'name email avatar' },
                { path: 'assignedMembers.user', select: 'name email avatar' }
            ]);

            result = project;
        } else if (invitation.type === 'workspace') {
            // Handle workspace invitation (your existing logic)
            const workspace = await Workspace.findById(invitation.workspace);
            if (!workspace) {
                return res.status(404).json({
                    success: false,
                    message: 'Workspace not found'
                });
            }

            // Check if user is already in workspace
            if (workspace.isMember(user._id)) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already a member of this workspace'
                });
            }

            // Add user to workspace
            await workspace.addMember(user._id, invitation.role, invitation.invitedBy);
            await workspace.populate([
                { path: 'owner', select: 'name email avatar' },
                { path: 'members.user', select: 'name email avatar' }
            ]);

            result = workspace;
        }

        // Update invitation status
        invitation.status = 'accepted';
        await invitation.save();

        res.json({
            success: true,
            message: 'Invitation accepted successfully',
            data: result,
            invitationType: invitation.type
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error accepting invitation'
        });
    }
});

module.exports = router;