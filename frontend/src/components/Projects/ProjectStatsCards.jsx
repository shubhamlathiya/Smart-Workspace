import React from 'react';
import {motion} from 'framer-motion';
import {FolderOpen, Rocket, CheckCircle, Pause} from 'lucide-react';

const ProjectStatsCards = ({projectStats}) => {
    const stats = [
        {
            title: 'Total Projects',
            value: projectStats.total,
            icon: FolderOpen,
            gradient: 'from-blue-500 to-cyan-600',
        },
        {
            title: 'Active',
            value: projectStats.active,
            icon: Rocket,
            gradient: 'from-green-500 to-emerald-600',
        },
        {
            title: 'Completed',
            value: projectStats.completed,
            icon: CheckCircle,
            gradient: 'from-purple-500 to-indigo-600',
        },
        {
            title: 'On Hold',
            value: projectStats.onHold,
            icon: Pause,
            gradient: 'from-orange-500 to-red-600',
        },
    ];

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.1}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div key={idx} className="glass-card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-sm">{stat.title}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div
                                className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-full flex items-center justify-center`}
                            >
                                <Icon className="w-6 h-6 text-white"/>
                            </div>
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default ProjectStatsCards;
