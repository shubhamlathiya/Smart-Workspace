const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userDoc) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.userDoc.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Middleware to check workspace membership
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    console.log(req.params);
    const Workspace = require('../models/Workspace');
    const workspaceId = req.params.id || req.body.workspace || req.query.workspace;
    console.log(workspaceId)
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required.'
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.'
      });
    }

    // Check if user is owner or member
    const isOwner = workspace.owner.toString() === req.user.userId;
    const isMember = workspace.isMember(req.user.userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.'
      });
    }

    req.workspace = workspace;
    req.userRole = isOwner ? 'owner' : workspace.getUserRole(req.user.userId);
    next();
  } catch (error) {
    console.error('Workspace access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking workspace access.'
    });
  }
};

// Middleware to check project access
const checkProjectAccess = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    // console.log("Projects")
    // console.log(req.params)
    const projectId = req.params.id || req.body.project || req.query.project;
    // console.log(projectId);
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required.'
      });
    }

    const project = await Project.findById(projectId).populate('workspace');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Check workspace access first
    const isWorkspaceOwner = project.workspace.owner.toString() === req.user.userId;
    const isWorkspaceMember = project.workspace.isMember(req.user.userId);

    if (!isWorkspaceOwner && !isWorkspaceMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.'
      });
    }

    // Check project assignment
    const isProjectAssigned = project.isAssigned(req.user.userId);
    const isProjectCreator = project.createdBy.toString() === req.user.userId;

    if (!isProjectAssigned && !isProjectCreator && !isWorkspaceOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this project.'
      });
    }

    req.project = project;
    req.projectRole = isProjectCreator ? 'creator' :
                     isWorkspaceOwner ? 'owner' :
                     project.getUserRole(req.user.userId);
    next();
  } catch (error) {
    console.error('Project access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking project access.'
    });
  }
};

module.exports = {
  auth,
  authorize,
  checkWorkspaceAccess,
  checkProjectAccess
};
