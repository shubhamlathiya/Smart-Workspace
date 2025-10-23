import React from 'react';
import {motion} from 'framer-motion';

const TaskDetailPage = () => {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="glass-card"
            >
                <h1 className="text-3xl font-bold text-white mb-2">Task Details</h1>
                <p className="text-white/70">Task detail page coming soon...</p>
            </motion.div>
        </div>
    );
};

export default TaskDetailPage;
