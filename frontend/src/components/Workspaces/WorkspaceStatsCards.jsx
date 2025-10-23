import React from 'react';
import {motion} from 'framer-motion';
import {Users, Home, UserCheck} from 'lucide-react'; // Choose suitable icons

const WorkspaceStatsCards = ({userWorkspaces, ownedWorkspaces, memberWorkspaces}) => {
    const cards = [
        {
            title: 'Total Workspaces',
            value: userWorkspaces.length,
            icon: Home,
            color: 'from-blue-500 to-cyan-600',
        },
        {
            title: 'Owned',
            value: ownedWorkspaces.length,
            icon: UserCheck,
            color: 'from-green-500 to-emerald-600',
        },
        {
            title: 'Member',
            value: memberWorkspaces.length,
            icon: Users,
            color: 'from-purple-500 to-indigo-600',
        },
    ];

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.1}}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div key={idx} className="glass-card p-4 flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-sm">{card.title}</p>
                            <p className="text-2xl font-bold text-white">{card.value}</p>
                        </div>
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${card.color}`}
                        >
                            <Icon className="w-6 h-6 text-white"/>
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default WorkspaceStatsCards;
