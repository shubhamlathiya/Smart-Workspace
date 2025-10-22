const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['lead', 'member', 'observer'],
      default: 'member'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  settings: {
    allowTaskCreation: {
      type: Boolean,
      default: true
    },
    allowMemberAssignment: {
      type: Boolean,
      default: true
    },
    defaultTaskPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
projectSchema.index({ workspace: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'assignedMembers.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ name: 'text', description: 'text' });

// Virtual for task count (will be populated)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Virtual for completed task count
projectSchema.virtual('completedTaskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
  match: { status: 'completed' }
});

// Method to check if user is assigned to project
projectSchema.methods.isAssigned = function(userId) {
  return this.assignedMembers.some(member => member.user.toString() === userId.toString());
};

// Method to get user role in project
projectSchema.methods.getUserRole = function(userId) {
  const member = this.assignedMembers.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Method to add member to project
projectSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isAssigned(userId)) {
    this.assignedMembers.push({
      user: userId,
      role: role
    });
  }
  return this.save();
};

// Method to remove member from project
projectSchema.methods.removeMember = function(userId) {
  this.assignedMembers = this.assignedMembers.filter(member => member.user.toString() !== userId.toString());
  return this.save();
};

// Pre-save middleware to update completion percentage
projectSchema.pre('save', async function(next) {
  if (this.isModified('completionPercentage')) {
    if (this.completionPercentage === 100 && this.status !== 'completed') {
      this.status = 'completed';
    } else if (this.completionPercentage < 100 && this.status === 'completed') {
      this.status = 'active';
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
