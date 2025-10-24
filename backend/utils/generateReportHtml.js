// reportUtils.js

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
// NOTE: Assume router, Task, Project, auth, and uploadDir are defined or required elsewhere.


// --- GLOBAL STYLES & CONSTANTS ---
const colors = {
    primary: '#1e40af', secondary: '#4b5563', success: '#059669',
    warning: '#d97706', danger: '#dc2626', light: '#f9fafb',
    dark: '#111827', border: '#e5e7eb', accent: '#3b82f6',
};
const icons = {
    user: '⦿', calendar: '📅', flag: '⚑', clock: '◷', document: '▣',
    comment: '💬', attachment: '📎', subtask: '■', project: '⌸',
    workspace: '🏢', check: '✓', dependency: '⬦', tag: '◒'
};


// --- GLOBAL HELPER FUNCTIONS ---

const getStatusBadge = (status) => {
    const statusConfig = {
        'todo': {color: '#ffffff', background: colors.secondary, text: 'TO DO'},
        'in-progress': {color: colors.dark, background: colors.warning, text: 'IN PROGRESS'},
        'review': {color: '#ffffff', background: colors.primary, text: 'UNDER REVIEW'},
        'completed': {color: '#ffffff', background: colors.success, text: 'COMPLETED'}
    };
    return statusConfig[status] || {
        color: colors.secondary,
        background: colors.light,
        text: String(status || 'N/A').toUpperCase()
    };
};

const getPriorityBadge = (priority) => {
    const priorityConfig = {
        'low': {color: colors.success, text: 'LOW'},
        'medium': {color: colors.warning, text: 'MEDIUM'},
        'high': {color: colors.danger, text: 'HIGH'},
        'urgent': {color: colors.danger, text: 'URGENT', background: '#fee2e2'}
    };
    return priorityConfig[priority] || {color: colors.secondary, text: String(priority || 'N/A').toUpperCase()};
};

const generatePdfFromHtml = async (htmlContent, filePath) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, {waitUntil: 'networkidle0'});

    await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {top: '0px', right: '0px', bottom: '0px', left: '0px'},
    });

    await browser.close();
};


// --- HTML CONTENT GENERATION (CORE LOGIC) ---
const generateReportHtml = (task, timelineItems, taskId, logoSrc) => {
    // --- HELPER FUNCTIONS ---
    const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
    const subtaskCompletionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    const logoPath = path.join(__dirname, 'logo.jpg');

    console.log(logoPath);
// 1. Read the image file and convert it to a Base64 string
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

// 2. Create the Base64 Data URI string
// NOTE: Ensure the MIME type (image/jpeg) matches your file type.
    const finalLogoSrc = `data:image/jpeg;base64,${logoBase64}`;

    // Helper to safely format dates
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
    const formatDateTime = (date) => date ? new Date(date).toLocaleString() : 'N/A';
    const isEncrypted = (content) => content && content.length > 20 && content.includes('U2FsdGVkX1');

    // Helper to safely extract a project field or default to 'N/A'
    const getProjectValue = (field, formatter = (v) => v || 'N/A') => {
        return formatter(task.project ? task.project[field] : null);
    };

    // Helper to get a project status/priority badge safely
    const getProjectBadge = (field) => {
        const projectField = task.project ? task.project[field] : null;
        if (!projectField) return '<span style="color: ' + colors.secondary + ';">N/A</span>';
        const badgeData = field === 'status' ? getStatusBadge(projectField) : getPriorityBadge(projectField);
        // Using getStatusBadge and getPriorityBadge helpers from the outer scope (assumed available)
        return `<span class="badge" style=" color: ${badgeData.color || 'white'};">${badgeData.text}</span>`;
    }

    // --- CSS STYLES (Kept as is for brevity) ---
    const styles = `
        <style>
            /* Reset and Global Styles */
            body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; font-size: 10px; color: ${colors.dark}; }
            .container { padding: 0 50px; }
            
            .section-wrapper { padding-top: 20px; }
            .page-break-before { page-break-before: always; } 

            .section-title {
                font-size: 16px; color: ${colors.dark}; font-weight: bold;
                border-bottom: 3px solid ${colors.accent}; padding-bottom: 5px;
                margin-top: 20px; margin-bottom: 15px; width: 300px;
            }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-right: 10px; }
            .badge-status-todo { background-color: ${colors.secondary}; color: white; }
            .badge-status-progress { background-color: ${colors.warning}; color: ${colors.dark}; }
            .badge-status-review { background-color: ${colors.primary}; color: white; }
            .badge-status-completed { background-color: ${colors.success}; color: white; }
            
            .badge-priority-low { background-color: ${colors.success}; color: white; }
            .badge-priority-medium { background-color: ${colors.warning}; color: white; }
            .badge-priority-high { background-color: ${colors.danger}; color: white; }

            .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px 20px; margin-top: 15px; }
            .metric-card { background-color: ${colors.light}; padding: 10px; border-radius: 5px; height: 40px; box-sizing: border-box;}
            .metric-key { font-size: 9px; color: ${colors.secondary}; margin-bottom: 2px; }
            .metric-value { font-size: 11px; font-weight: bold; color: ${colors.dark}; }
            
            .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .data-table th, .data-table td { padding: 8px 10px; text-align: left; font-size: 9px; }
            .data-table th { background-color: ${colors.primary}; color: white; font-weight: bold; }
            .data-table tr:nth-child(even) { background-color: ${colors.light}; }
            
            .comment-card { background-color: ${colors.light}; border: 0.5px solid ${colors.border}; padding: 10px; margin-bottom: 10px; border-radius: 5px;}
            .comment-author { font-weight: bold; font-size: 10px; }
            .comment-date { font-size: 8px; color: ${colors.secondary}; margin-bottom: 5px; }
            .encrypted-note { font-style: italic; color: ${colors.danger}; font-size: 9px; margin-top: 5px; }

            /* --- HEADER & FOOTER (CSS Paged Media) --- */
            @page {
                size: A4; margin-top: 10px; margin-bottom: 60px;
                @top { content: element(header); }
                @bottom { content: element(footer); }
            }
            #pdf-header { 
                position: running(header); 
                color: black; height: 60px; width: 100%; padding-top: 10px; 
                box-sizing: border-box; padding-left: 50px; padding-right: 50px;
            }
            .header-content { display: flex; align-items: center; justify-content: space-between; height: 50px; }
            .logo-title-area { display: flex; align-items: center; }
            .logo { height: 40px; width: auto; margin-right: 15px; filter: invert(1); } 

            #pdf-footer { 
                position: running(footer); color: ${colors.secondary}; 
                font-size: 8px; width: 100%; padding-top: 10px;
                border-top: 1px solid ${colors.border}; text-align: right;
                padding-right: 50px; box-sizing: border-box;
            }
            .page-number::after { content: counter(page); }
            .page-total::after { content: counter(pages); }
        </style>
    `;

    // --- Fixed Header/Footer HTML (Kept as is) ---
    const fixedElements = `
    <div id="pdf-header">
        <div class="header-content" style="display: flex; align-items: center; justify-content: space-between; height: 50px;">
            
            <div style="width: 33%; display: flex; align-items: center; justify-content: flex-start;">
                <img 
                    src="${finalLogoSrc}" 
                    class="logo" 
                    alt="Company Logo"
                    // Maximized height to 50px to fit the parent container
                    style="height: 50px; width: auto; filter: invert(1);"
                />
            </div>
            
            <div style="width: 33%; text-align: center; color: black;">
                <span style="font-size: 18px; font-weight: bold; letter-spacing: 1px;">TASK COMPLETION REPORT</span>
                <div style="font-size: 9px; opacity: 0.9; margin-top: 2px;">PROJECT MANAGEMENT SUMMARY</div>
            </div>

            <div style="width: 33%; text-align: right; color: black;">
                <span style="font-size: 8px; font-weight: normal; opacity: 0.9;">Generated: ${formatDateTime(new Date())}</span>
                <div style="font-size: 10px; font-weight: bold; margin-top: 5px;">
                    PAGE <span class="page-number"></span> OF <span class="page-total"></span>
                </div>
            </div>
        </div>
    </div>
`;

    // --- MAIN REPORT CONTENT ---
    let mainContent = `
        <div class="container">
            <div style="margin-top: 20px;">
                <h1 style="font-size: 24px; color: ${colors.dark}; margin-bottom: 15px;">${task.title || 'Untitled Task'}</h1>
                
                <span class="badge badge-status-${task.status}">${(task.status || 'N/A').toUpperCase()}</span>
                <span class="badge badge-priority-${task.priority}" style="background-color: ${getPriorityBadge(task.priority).color}; color: white;">${(task.priority || 'N/A').toUpperCase()}</span>
            </div>

            
            <div class="section-wrapper"> 
                <h2 class="section-title">${icons.document} Key Metrics (Task Snapshot)</h2>
                
                <div class="metric-grid">
                    <div class="metric-card"><div class="metric-key">${icons.project} Project</div><div class="metric-value">${task.project?.name || 'N/A'}</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.workspace} Workspace</div><div class="metric-value">${task.workspace?.name || 'N/A'}</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.user} Created By</div><div class="metric-value">${task.createdBy?.name || 'N/A'}</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.calendar} Created Date</div><div class="metric-value">${formatDate(task.createdAt)}</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.clock} Estimated Hours</div><div class="metric-value">${task.estimatedHours > 0 ? `${task.estimatedHours}h` : task.estimatedHours === 0 ? '0h' : 'N/A'}</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.clock} Actual Hours</div><div class="metric-value">${task.actualHours > 0 ? `${task.actualHours}h` : task.actualHours === 0 ? '0h' : 'N/A'}</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.subtask} Subtasks Progress</div><div class="metric-value">${completedSubtasks}/${totalSubtasks} (${subtaskCompletionPercentage}%)</div></div>
                    <div class="metric-card"><div class="metric-key">${icons.comment} Comments Count</div><div class="metric-value">${task.comments?.length || 0}</div></div>
                </div>
            </div>
            
            ${task.project ? `
                <div class="section-wrapper"> 
                    <h2 class="section-title">${icons.project} Project Details: ${task.project.name || 'N/A'}</h2>

                    <table class="data-table" style="margin-bottom: 15px;">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Attribute</th>
                                <th style="width: 25%;">Value</th>
                                <th style="width: 25%;">Attribute</th>
                                <th style="width: 25%;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Project ID</td>
                                <td>${task.project._id || 'N/A'}</td>
                                <td>Status</td>
                                <td>${getProjectBadge('status')}</td>
                            </tr>
                            <tr>
                                <td>Workspace</td>
                                <td>${getProjectValue('workspace', (w) => w?.name || 'N/A')}</td>
                                <td>Priority</td>
                                <td>${getProjectBadge('priority')}</td>
                            </tr>
                            <tr>
                                <td>Created By</td>
                                <td>${getProjectValue('createdBy', (c) => c?.name || 'N/A')}</td>
                                <td>Completion (%)</td>
                                <td>${getProjectValue('completionPercentage', (p) => p !== null ? `${p}%` : 'N/A')}</td>
                            </tr>
                            <tr>
                                <td>Start Date</td>
                                <td>${getProjectValue('startDate', formatDate)}</td>
                                <td>Due Date</td>
                                <td>${getProjectValue('dueDate', formatDate)}</td>
                            </tr>
                            <tr>
                                <td>Created At</td>
                                <td>${getProjectValue('createdAt', formatDateTime)}</td>
                                <td>Last Updated</td>
                                <td>${getProjectValue('updatedAt', formatDateTime)}</td>
                            </tr>
                            <tr>
                                <td>Archived</td>
                                <td>${getProjectValue('isArchived', (v) => v ? 'Yes' : 'No')}</td>
                                <td>Tags</td>
                                <td>${task.project.tags && task.project.tags.length > 0 ? task.project.tags.join(', ') : 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>

                    ${task.project.description ? `
                        <div style="margin-top: 10px;">
                            <p style="font-weight: bold; margin-bottom: 5px;">Description:</p>
                            <p style="font-size: 10px; line-height: 1.5; text-align: justify; padding-left: 10px; border-left: 2px solid ${colors.light};">${task.project.description}</p>
                        </div>
                    ` : `
                        <div style="font-size: 10px; color: ${colors.secondary}; margin-top: 10px;">Project Description: Data Not Available</div>
                    `}

                    ${task.project.assignedMembers && task.project.assignedMembers.length > 0 ? `
                        <div class="section-wrapper" style="padding-top: 15px;"> 
                            <h3 style="font-size: 12px; color: ${colors.dark}; margin-bottom: 5px;">${icons.user} Project Team (${task.project.assignedMembers.length} Members)</h3>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width: 30%;">User Name</th>
                                        <th style="width: 30%;">Role</th>
                                        <th style="width: 40%;">Assigned At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${task.project.assignedMembers.map(assignment => `
                                        <tr>
                                            <td>${assignment.user?.name || 'N/A'}</td>
                                            <td>${assignment.role || 'N/A'}</td>
                                            <td>${formatDateTime(assignment.assignedAt)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `<div style="font-size: 10px; color: ${colors.secondary}; margin-top: 15px;">Project Team: Data Not Available</div>`}


                    <div class="section-wrapper" style="padding-top: 15px;">
                        <h3 style="font-size: 14px; color: ${colors.dark}; font-weight: bold; margin-bottom: 5px;">${icons.check} Project Progress Report Summary</h3>
                        <p style="font-size: 10px; line-height: 1.5; margin-bottom: 10px;">
                            <span style="font-weight: bold;">Overall Status:</span> ${getProjectBadge('status')}
                            <span style="font-weight: bold; margin-left: 20px;">Completion:</span> <span style="font-weight: bold; color: ${colors.primary};">${getProjectValue('completionPercentage', (p) => p !== null ? `${p}%` : 'N/A')}</span>
                        </p>
                        
                        <div style="margin-top: 10px; border: 1px solid ${colors.border}; padding: 10px; border-radius: 5px; background-color: #f0f4ff;">
                            <p style="font-weight: bold; margin-bottom: 5px; font-size: 11px; color: ${colors.primary};">Key Settings & Governance:</p>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 10px;">
                                <li style="margin-bottom: 3px;"><span style="font-weight: bold;">Allow Task Creation:</span> ${getProjectValue('settings', (s) => s?.allowTaskCreation ? 'Yes' : 'No')}</li>
                                <li style="margin-bottom: 3px;"><span style="font-weight: bold;">Allow Member Assignment:</span> ${getProjectValue('settings', (s) => s?.allowMemberAssignment ? 'Yes' : 'No')}</li>
                                <li><span style="font-weight: bold;">Default Task Priority:</span> ${getProjectValue('settings', (s) => s?.defaultTaskPriority || 'N/A').toUpperCase()}</li>
                            </ul>
                        </div>
                    </div>

                </div>
            ` : `<div class="section-wrapper"><h2 class="section-title">${icons.project} Project Details</h2><div style="font-size: 10px; color: ${colors.danger};">Project Data Not Found</div></div>`}
            ${task.description ? `
                <div class="section-wrapper"> 
                    <h2 class="section-title">${icons.document} Task Description</h2>
                    <p style="font-size: 10px; line-height: 1.5; text-align: justify;">${task.description}</p>
                </div>
            ` : `<div class="section-wrapper"><h2 class="section-title">${icons.document} Task Description</h2><div style="font-size: 10px; color: ${colors.secondary};">Description Not Available</div></div>`}

            ${(timelineItems.length > 0) ? `
                <div class="section-wrapper">
                    <h2 class="section-title">${icons.calendar} Timeline</h2>
                    <ul style="list-style: none; padding: 0;">
                        ${timelineItems.map(item => `
                            <li style="margin-bottom: 10px; font-size: 10px;">
                                <span style="font-weight: bold;">${item.icon} ${item.label}:</span> 
                                <span style="color: ${colors.secondary}; margin-left: 10px;">${formatDate(item.date)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : `<div class="section-wrapper"><h2 class="section-title">${icons.calendar} Timeline</h2><div style="font-size: 10px; color: ${colors.secondary};">No key timeline dates were recorded.</div></div>`}


            ${(task.assignedTo && task.assignedTo.length > 0) ? `
                <div class="section-wrapper"> 
                    <h2 class="section-title">${icons.user} Team Assignment (${task.assignedTo.length} Members)</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 30%;">User</th>
                                <th style="width: 35%;">Email</th>
                                <th style="width: 15%;">Role</th>
                                <th style="width: 20%;">Assigned By</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${task.assignedTo.map(assignment => `
                                <tr>
                                    <td>${assignment.user?.name || 'N/A'}</td>
                                    <td>${assignment.user?.email || 'N/A'}</td>
                                    <td>${assignment.user?.role || 'N/A'}</td>
                                    <td>${assignment.assignedBy?.name || 'System'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `<div class="section-wrapper page-break-before"><h2 class="section-title">${icons.user} Team Assignment</h2><div style="font-size: 10px; color: ${colors.secondary};">No users are currently assigned to this task.</div></div>`}
            
            ${(task.subtasks && task.subtasks.length > 0) ? `
                <div class="section-wrapper">
                    <h2 class="section-title">${icons.subtask} Subtasks Checklist</h2>
                    <ul style="list-style: none; padding: 0;">
                        ${task.subtasks.map(subtask => `
                            <li style="margin-bottom: 5px; font-size: 10px; color: ${subtask.completed ? colors.success : colors.dark};">
                                <span style="font-weight: bold;">${subtask.completed ? icons.check : icons.subtask} ${subtask.title || 'Untitled Subtask'}</span>
                                <span style="float: right; font-size: 8px; color: ${colors.secondary};">Created: ${formatDate(subtask.createdAt)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : `<div class="section-wrapper"><h2 class="section-title">${icons.subtask} Subtasks Checklist</h2><div style="font-size: 10px; color: ${colors.secondary};">No subtasks have been created for this task.</div></div>`}

            ${(task.dependencies && task.dependencies.length > 0) ? `
                <div class="section-wrapper">
                    <h2 class="section-title">${icons.dependency} Task Dependencies</h2>
                    ${task.dependencies.map(dependency => {
        const depStatus = getStatusBadge(dependency.task?.status);
        const dependencyType = ({
            'blocks': 'Blocks',
            'blocked-by': 'Blocked By',
            'related': 'Related To'
        })[dependency.type] || dependency.type || 'N/A';
        return `
                            <div style="border-left: 3px solid ${depStatus.background}; padding-left: 10px; margin-bottom: 15px;">
                                <div style="font-weight: bold; font-size: 10px;">${dependency.task?.title || 'Unknown Task'}</div>
                                <div style="font-size: 9px; color: ${colors.secondary}; margin-top: 2px;">Type: ${dependencyType}</div>
                                <span class="badge" style="background-color: ${depStatus.background}; color: ${depStatus.color}; margin-top: 5px;">${depStatus.text}</span>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : `<div class="section-wrapper"><h2 class="section-title">${icons.dependency} Task Dependencies</h2><div style="font-size: 10px; color: ${colors.secondary};">No dependencies found.</div></div>`}

            ${(task.comments && task.comments.length > 0) ? `
                <div class="section-wrapper"> 
                    <h2 class="section-title">${icons.comment} Comments & History (${task.comments.length} Entries)</h2>
                    ${task.comments.map(comment => `
                        <div class="comment-card">
                            <div class="comment-author">${comment.user?.name || 'Unknown User'}</div>
                            <div class="comment-date">${formatDateTime(comment.createdAt)} ${comment.isEdited ? '(Edited)' : ''}</div>
                            <p style="font-size: 9px; margin: 0; line-height: 1.4;">
                                ${comment.content || 'No content'}
                                ${isEncrypted(comment.content) ? '<span class="encrypted-note">(Note: Content appears to be encrypted/encoded and cannot be displayed.)</span>' : ''}
                            </p>
                        </div>
                    `).join('')}
                </div>
            ` : `<div class="section-wrapper page-break-before"><h2 class="section-title">${icons.comment} Comments & History</h2><div style="font-size: 10px; color: ${colors.secondary};">No comments or activity history found for this task.</div></div>`}

            ${(task.attachments && task.attachments.length > 0) ? `
                <div class="section-wrapper">
                    <h2 class="section-title">${icons.attachment} Attachments (${task.attachments.length} Files)</h2>
                    ${task.attachments.map((attachment, index) => `
                        <div style="margin-bottom: 15px;">
                            <div style="font-weight: bold; font-size: 10px;">${icons.attachment} ${index + 1}. ${attachment.originalName || attachment.filename || 'Unnamed file (N/A)'}</div>
                            <div style="font-size: 8px; color: ${colors.secondary}; margin-left: 15px;">
                                Size: ${attachment.size ? `${(attachment.size / 1024).toFixed(2)}KB` : 'N/A'} • Type: ${attachment.mimeType || 'N/A'} • Uploaded by: ${attachment.uploadedBy?.name || 'N/A'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `<div class="section-wrapper"><h2 class="section-title">${icons.attachment} Attachments</h2><div style="font-size: 10px; color: ${colors.secondary};">No attachments found.</div></div>`}

        </div>
    `;

    return styles + fixedElements + mainContent;
};

module.exports = {
    generatePdfFromHtml,
    generateReportHtml,
    colors,
    icons
};