import React from 'react';
import {motion} from 'framer-motion';
import {List, Clipboard, RefreshCcw, Clock, CheckCircle, AlertCircle} from 'lucide-react';

const taskStatCards = [
    {label: 'Total', valueKey: 'total', icon: List, color: 'from-gray-500 to-gray-600'},
    {label: 'To Do', valueKey: 'todo', icon: Clipboard, color: 'from-blue-500 to-blue-600'},
    {label: 'In Progress', valueKey: 'inProgress', icon: RefreshCcw, color: 'from-yellow-500 to-yellow-600'},
    {label: 'Review', valueKey: 'review', icon: Clock, color: 'from-orange-500 to-orange-600'},
    {label: 'Completed', valueKey: 'completed', icon: CheckCircle, color: 'from-green-500 to-green-600'},
    {label: 'Overdue', valueKey: 'overdue', icon: AlertCircle, color: 'from-red-500 to-red-600'},
];

const TaskStatsCards = ({taskStats}) => {
    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5}}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
            {taskStatCards.map((card) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={card.label}
                        whileHover={{scale: 1.05}}
                        transition={{type: 'spring', stiffness: 300}}
                        className="glass-card p-4 flex flex-col items-center justify-center text-center shadow-lg"
                    >
                        <div
                            className={`w-12 h-12 mb-2 rounded-full flex items-center justify-center bg-gradient-to-r ${card.color}`}
                        >
                            <Icon className="w-6 h-6 text-white"/>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{taskStats[card.valueKey]}</div>
                        <div className="text-white/70 text-sm">{card.label}</div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

export default TaskStatsCards;
