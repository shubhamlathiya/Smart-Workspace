const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Workspace name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'guest'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    defaultTaskStatus: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'completed'],
      default: 'todo'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
workspaceSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is member
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to get user role in workspace
workspaceSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Method to add member
workspaceSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role,
      invitedBy: invitedBy
    });
  }
  return this.save();
};

// Method to remove member
workspaceSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Workspace', workspaceSchema);
