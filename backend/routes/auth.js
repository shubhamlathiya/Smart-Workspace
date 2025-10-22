const express = require('express');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Invitation = require('../models/Invitation');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           description: The user's email address
 *         role:
 *           type: string
 *           enum: [admin, member, guest]
 *           description: The user's role
 *         avatar:
 *           type: string
 *           description: URL to user's avatar image
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *             refreshToken:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               invitationToken:
 *                 type: string
 *                 description: Optional invitation token to automatically accept invitations
 *                 example: "abc123def456"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
router.post('/register', [
    body('name').trim().isLength({min: 2, max: 50}).withMessage('Name must be between 2 and 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long')
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

        const {name, email, password, invitation} = req.body;
        console.log(req.body);
        // Check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }


        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Handle invitation acceptance if token is valid
        if (invitation) {
            try {
                if (invitation.projectId) {

                    const Project = require('../models/Project');
                    const project = await Project.findById(invitation.projectId).populate('workspace');

                    if (!project) {
                        return res.status(404).json({ success: false, message: 'Project not found' });
                    }

                    // Check if user is already assigned to project
                    if (project.isAssigned(user._id)) {
                        return res.status(400).json({
                            success: false,
                            message: 'User is already assigned to this project.'
                        });
                    }

                    // Add user to project
                    await project.addMember(user._id, invitation.role);

                    // Add user to workspace if not already a member
                    const workspace = project.workspace;
                    if (!workspace.members.some(m => m.user.toString() === user._id.toString())) {
                        workspace.members.push({
                            user: user._id,
                            role: 'member', // default role
                            invitedBy: project.createdBy,
                            joinedAt: new Date()
                        });
                        await workspace.save();
                        console.log(`User ${email} added to workspace ${workspace.name}`);
                    }


                } else {
                    const workspace = await Workspace.findById(invitation.workspaceId)
                    if (workspace.isMember(user._id)) {
                        return res.status(400).json({
                            success: false,
                            message: 'User is already a member of this workspace.'
                        });
                    }
                    console.log(workspace)
                    // Add member directly
                    await workspace.addMember(user._id, invitation.role, workspace.owner);


                    console.log(`User ${user.email} automatically accepted ${invitation.type} invitation during registration`);
                }
            } catch (acceptError) {
                console.error('Error accepting invitation during registration:', acceptError);
                // Don't fail registration if invitation acceptance fails
            }
        }

        // Generate tokens
        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRE || '7d'}
        );

        const refreshToken = jwt.sign(
            {userId: user._id},
            process.env.JWT_REFRESH_SECRET,
            {expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'}
        );

        // Save refresh token
        user.refreshTokens.push({token: refreshToken});
        await user.save();

        // Prepare response data
        const responseData = {
            success: true,
            message: invitation ? 'User registered successfully and invitation accepted' : 'User registered successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified
                },
                token,
                refreshToken
            }
        };

        // Add invitation info to response if applicable
        if (invitation) {
            responseData.data.invitation = {
                type: invitation.type,
                role: invitation.role,
                accepted: true
            };

            if (invitation.type === 'project' && invitation.project) {
                responseData.data.invitation.project = {
                    _id: invitation.project._id,
                    name: invitation.project.name
                };
            } else if (invitation.type === 'workspace' && invitation.workspace) {
                responseData.data.invitation.workspace = {
                    _id: invitation.workspace._id,
                    name: invitation.workspace.name
                };
            }
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Helper function to accept invitation for user
const acceptInvitationForUser = async (invitation, userId) => {
    try {
        if (invitation.type === 'workspace') {
            const workspace = await Workspace.findById(invitation.workspace);
            if (!workspace) {
                throw new Error('Workspace not found');
            }

            // Check if user is already a member
            if (workspace.isMember(userId)) {
                throw new Error('User is already a member of this workspace');
            }

            // Add user to workspace
            await workspace.addMember(userId, invitation.role, invitation.invitedBy);

            console.log(`User ${userId} added to workspace ${workspace.name} as ${invitation.role}`);

        } else if (invitation.type === 'project') {
            const project = await Project.findById(invitation.project);
            if (!project) {
                throw new Error('Project not found');
            }

            // Check if user is already assigned
            if (project.isAssigned(userId)) {
                throw new Error('User is already assigned to this project');
            }

            // Add user to project
            await project.addMember(userId, invitation.role);

            console.log(`User ${userId} added to project ${project.name} as ${invitation.role}`);
        }
    } catch (error) {
        console.error('Error in acceptInvitationForUser:', error);
        throw error;
    }
};


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
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

        const {email, password} = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({email}).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRE || '7d'}
        );

        const refreshToken = jwt.sign(
            {userId: user._id},
            process.env.JWT_REFRESH_SECRET,
            {expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'}
        );

        // Save refresh token
        user.refreshTokens.push({token: refreshToken});
        await user.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                    lastLogin: user.lastLogin
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh', async (req, res) => {
    try {
        const {refreshToken} = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if refresh token exists in user's tokens
        const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const newToken = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRE || '7d'}
        );

        const newRefreshToken = jwt.sign(
            {userId: user._id},
            process.env.JWT_REFRESH_SECRET,
            {expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'}
        );

        // Remove old refresh token and add new one
        await user.removeRefreshToken(refreshToken);
        user.refreshTokens.push({token: newRefreshToken});
        await user.save();

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/logout', auth.auth, async (req, res) => {
    try {
        const {refreshToken} = req.body;
        const user = await User.findById(req.user.userId);

        if (refreshToken) {
            await user.removeRefreshToken(refreshToken);
        } else {
            // Remove all refresh tokens
            user.refreshTokens = [];
            await user.save();
        }

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', auth.auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        res.json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving profile'
        });
    }
});


router.post('/register-with-invitation', [
    body('token').notEmpty().withMessage('Token is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {token, name, email, password} = req.body;

        // Verify invitation first
        const invitation = await Invitation.findValidInvitation(token);
        if (!invitation) {
            return res.status(400).json({
                message: 'Invalid or expired invitation'
            });
        }

        // Check if email matches invitation
        if (invitation.email !== email) {
            return res.status(400).json({
                message: 'Email does not match invitation'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists. Please login instead.'
            });
        }

        // Create new user
        const user = new User({name, email, password});
        await user.save();

        // Accept the invitation automatically
        await acceptInvitationForUser(invitation, user._id);

        // Generate auth token
        const authToken = generateAuthToken(user);

        res.json({
            success: true,
            message: 'Registration successful and invitation accepted',
            token: authToken,
            user: {id: user._id, name: user.name, email: user.email}
        });

    } catch (error) {
        console.error('register-with-invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving profile'
        });
    }
});
module.exports = router;
