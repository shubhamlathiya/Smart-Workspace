const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth');
const {
    uploadSingle, uploadMultiple, handleUploadError, deleteFile, getFileInfo, uploadDir
} = require('../middleware/upload');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Upload single file for task
router.post('/task/:taskId', auth, uploadSingle('file'), handleUploadError, async (req, res) => {
    try {
        const {taskId} = req.params;
        console.log(req.user)
        if (!req.file) {
            return res.status(400).json({success: false, message: 'No file uploaded'});
        }

        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({success: false, message: 'Task not found'});
        }

        // Ensure members array exists
        const projectMembers = task.project.members || [];

        // // Access check: project members or project creator
        // if (!projectMembers.map(m => m.toString()).includes(req.user.id) &&
        //     task.project.createdBy.toString() !== req.user.id) {
        //     return res.status(403).json({ success: false, message: 'Access denied' });
        // }

        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user.userId
        };

        task.attachments.push(fileData);
        await task.save();

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {file: fileData, taskId: task._id, attachments: task.attachments}
        });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({success: false, message: 'Server error'});
    }
});

// Upload multiple files for task
router.post('/task/:taskId/multiple', auth, uploadMultiple('files', 10), handleUploadError, async (req, res) => {
    try {
        const {taskId} = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false, message: 'No files uploaded'
            });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false, message: 'Task not found'
            });
        }

        // Check if user has access to this task
        const project = await Project.findById(task.project);
        if (!project.members.includes(req.user.id) && project.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false, message: 'Access denied'
            });
        }

        // Add files to task
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedBy: req.user.id,
            uploadedAt: new Date()
        }));

        task.attachments.push(...uploadedFiles);
        await task.save();

        res.json({
            success: true, message: `${uploadedFiles.length} files uploaded successfully`, data: {
                files: uploadedFiles, task: {
                    id: task._id, title: task.title, attachments: task.attachments
                }
            }
        });

    } catch (error) {
        console.error('Multiple file upload error:', error);
        res.status(500).json({
            success: false, message: 'Server error'
        });
    }
});

const path = require('path');
const fs = require('fs');

// Download file
router.get('/download/:filename', async (req, res) => {
    try {
        const {filename} = req.params;
        console.log(filename)
        let filePath;

        // If filename starts with "task", use report folder
        if (filename.toLowerCase().startsWith('task')) {
            filePath = path.join(uploadDir, './reports', filename); // Adjust path to your report folder
        } else {
            // Otherwise, use getFileInfo function (existing logic)
            const fileInfo = getFileInfo(filename);
            if (!fileInfo) {
                return res.status(404).json({
                    success: false, message: 'File not found'
                });
            }
            filePath = fileInfo.path;
        }
        console.log(filePath)
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false, message: 'File not found'
            });
        }
        console.log(filePath)
        // Set headers and stream
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({
            success: false, message: 'Server error'
        });
    }
});

// Delete file from task
router.delete('/task/:taskId/:filename', auth, async (req, res) => {
    try {
        const {taskId, filename} = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false, message: 'Task not found'
            });
        }

        // Check if user has access to this task
        // const project = await Project.findById(task.project);
        // if (!project.members.includes(req.user.id) && project.createdBy.toString() !== req.user.id) {
        //     return res.status(403).json({
        //         success: false, message: 'Access denied'
        //     });
        // }

        // Find and remove file from task
        const fileIndex = task.attachments.findIndex(attachment => attachment.filename === filename);
        if (fileIndex === -1) {
            return res.status(404).json({
                success: false, message: 'File not found in task'
            });
        }

        // Check if user can delete this file (uploader or project admin)
        // const file = task.attachments[fileIndex];
        // if (file.uploadedBy.toString() !== req.user.id && project.createdBy.toString() !== req.user.id) {
        //     return res.status(403).json({
        //         success: false, message: 'You can only delete files you uploaded'
        //     });
        // }

        // Remove file from task
        task.attachments.splice(fileIndex, 1);
        await task.save();

        // Delete physical file
        const deleted = deleteFile(filename);
        if (!deleted) {
            console.warn(`Physical file ${filename} not found for deletion`);
        }

        res.json({
            success: true, message: 'File deleted successfully', data: {
                task: {
                    id: task._id, title: task.title, attachments: task.attachments
                }
            }
        });

    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({
            success: false, message: 'Server error'
        });
    }
});

// Get file info
router.get('/info/:filename', auth, async (req, res) => {
    try {
        const {filename} = req.params;

        const fileInfo = getFileInfo(filename);
        if (!fileInfo) {
            return res.status(404).json({
                success: false, message: 'File not found'
            });
        }

        res.json({
            success: true, data: {
                filename: fileInfo.filename,
                size: fileInfo.size,
                created: fileInfo.created,
                url: `/api/uploads/download/${filename}`
            }
        });

    } catch (error) {
        console.error('File info error:', error);
        res.status(500).json({
            success: false, message: 'Server error'
        });
    }
});

module.exports = router;
