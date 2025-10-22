// models/Invitation.js
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['lead', 'member', 'observer', 'admin', 'member', 'guest'], // Combined roles for both workspace and project
        default: 'member'
    },
    type: {
        type: String,
        enum: ['workspace', 'project'],
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: function() {
            return this.type === 'project';
        }
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'cancelled'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
invitationSchema.index({ email: 1, project: 1 });
invitationSchema.index({ email: 1, workspace: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
invitationSchema.index({ type: 1, status: 1 });


invitationSchema.statics.findValidInvitation = function(token) {
    return this.findOne({
        token,
        status: 'pending',
        expiresAt: { $gt: new Date() }
    })
        .populate('project', 'name description')
        .populate('workspace', 'name description')
        .populate('invitedBy', 'name email');
};

module.exports = mongoose.model('Invitation', invitationSchema);