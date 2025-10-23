import React from 'react';
import {motion} from 'framer-motion';
import {Plus, Users, FolderOpen, CheckSquare} from 'lucide-react';
import {useAppDispatch} from '../../hooks/redux';
import {openModal} from '../../features/ui/uiSlice.jsx';

const QuickActions = () => {
    const dispatch = useAppDispatch();

    const actions = [
        {
            title: 'Create Workspace',
            description: 'Start a new collaboration space',
            icon: Users,
            color: 'blue',
            onClick: () => dispatch(openModal('createWorkspace')),
        },
        {
            title: 'New Project',
            description: 'Add a project to your workspace',
            icon: FolderOpen,
            color: 'green',
            onClick: () => dispatch(openModal('createProject')),
        },
        {
            title: 'Add Task',
            description: 'Create a new task',
            icon: CheckSquare,
            color: 'purple',
            onClick: () => dispatch(openModal('createTask')),
        },
    ];

    return (
        <div className="neumorphic-card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.title}
                            onClick={action.onClick}
                            className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: index * 0.1}}
                            whileHover={{scale: 1.02}}
                        >
                            <div className="flex items-center space-x-3">
                                <div
                                    className={`w-8 h-8 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 text-${action.color}-600`}/>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{action.title}</p>
                                    <p className="text-sm text-gray-600">{action.description}</p>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
