const nodemailer = require('nodemailer');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: process.env.MAIL_PORT || 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
    debug: true,
    logger: true,
});

// Email templates
const emailTemplates = {
    workspaceInvitation: (workspaceName, inviterName, inviteLink) => ({
        subject: `You've been invited to join ${workspaceName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Smart Workspace</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">You're Invited!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to join the workspace 
              <strong>"${workspaceName}"</strong> on Smart Workspace Platform.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #667eea;">${inviteLink}</a>
            </p>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Smart Workspace Platform. All rights reserved.
            </p>
          </div>
        </div>
        `
    }),

    taskAssignment: (taskTitle, projectName, assignerName, taskLink) => ({
        subject: `New task assigned: ${taskTitle}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Smart Workspace</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">New Task Assigned</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${assignerName}</strong> has assigned you a new task in the project 
              <strong>"${projectName}"</strong>.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 10px 0;">${taskTitle}</h3>
              <p style="color: #666; margin: 0;">Project: ${projectName}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${taskLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                View Task
              </a>
            </div>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Smart Workspace Platform. All rights reserved.
            </p>
          </div>
        </div>
        `
    }),

    taskComment: (taskTitle, commenterName, comment, taskLink) => ({
        subject: `New comment on task: ${taskTitle}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Smart Workspace</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">New Comment</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${commenterName}</strong> commented on the task 
              <strong>"${taskTitle}"</strong>.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="color: #333; margin: 0; font-style: italic;">"${comment}"</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${taskLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                View Task
              </a>
            </div>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Smart Workspace Platform. All rights reserved.
            </p>
          </div>
        </div>
        `
    }),

    passwordReset: (resetLink) => ({
        subject: 'Password Reset Request',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Smart Workspace</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You requested a password reset for your Smart Workspace account. Click the button below to reset your password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Smart Workspace Platform. All rights reserved.
            </p>
          </div>
        </div>
        `
    }),

    projectInvitation : (projectName, inviterName, inviteLink) => ({
        subject: `You've been invited to join ${projectName}`,
        html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Project Invitation</h1>
        </div>
        <div class="content">
          <h2>You're invited to collaborate!</h2>
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on our platform.</p>
          <p>This invitation will expire in 7 days.</p>
          <div style="text-align: center;">
            <a href="${inviteLink}" class="button">Accept Invitation</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${inviteLink}">${inviteLink}</a></p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
    }),
};

// Send email function
const sendEmail = async (to, subjectOrTemplate, htmlContent = null) => {
    try {
        if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
            console.log('Email service not configured, skipping email send');
            return { success: true, message: 'Email service not configured' };
        }

        // Determine if subject/html is passed as template object or direct strings
        let subject, html;
        if (typeof subjectOrTemplate === 'object') {
            subject = subjectOrTemplate.subject;
            html = subjectOrTemplate.html;
        } else {
            subject = subjectOrTemplate;
            html = htmlContent;
        }

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to,
            subject,
            html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Email service functions
const emailService = {
    sendWorkspaceInvitation: async (email, workspaceName, inviterName, inviteLink) => {
        const template = emailTemplates.workspaceInvitation(workspaceName, inviterName, inviteLink);
        return await sendEmail(email, template);
    },

    sendProjectInvitation: async (email, projectName, inviterName, inviteLink) => {
        const template = emailTemplates.projectInvitation(projectName, inviterName, inviteLink);
        return await sendEmail(email, template);
    },
    sendTaskAssignment: async (email, taskTitle, projectName, assignerName, taskLink) => {
        const template = emailTemplates.taskAssignment(taskTitle, projectName, assignerName, taskLink);
        return await sendEmail(email, template);
    },

    sendTaskComment: async (email, taskTitle, commenterName, comment, taskLink) => {
        const template = emailTemplates.taskComment(taskTitle, commenterName, comment, taskLink);
        return await sendEmail(email, template);
    },

    sendPasswordReset: async (email, resetLink) => {
        const template = emailTemplates.passwordReset(resetLink);
        return await sendEmail(email, template);
    }
};

module.exports = emailService;
