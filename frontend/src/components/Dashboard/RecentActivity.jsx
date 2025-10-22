import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, CheckCircle } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'task_completed',
      title: 'Task completed',
      description: 'Mobile app design completed',
      user: 'John Doe',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'green',
    },
    {
      id: 2,
      type: 'project_created',
      title: 'Project created',
      description: 'New project "E-commerce Platform" created',
      user: 'Jane Smith',
      time: '4 hours ago',
      icon: User,
      color: 'blue',
    },
    {
      id: 3,
      type: 'workspace_joined',
      title: 'Member joined',
      description: 'Sarah Wilson joined the workspace',
      user: 'Sarah Wilson',
      time: '1 day ago',
      icon: User,
      color: 'purple',
    },
  ];

  return (
    <div className="neumorphic-card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-8 h-8 bg-${activity.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 text-${activity.color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No recent activity</p>
          <p className="text-sm text-gray-400">Activity will appear here as you work</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
