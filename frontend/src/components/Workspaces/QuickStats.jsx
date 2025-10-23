import React from 'react';
import { Users, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickStats = ({ currentWorkspace }) => {
    const stats = [
        {
            title: 'Members',
            value: currentWorkspace.members?.length || 0,
            icon: Users,
            color: 'from-purple-500 to-indigo-600',
        },
        {
            title: 'Admins',
            value: currentWorkspace.members?.filter(m => m.role === 'admin').length || 0,
            icon: ShieldCheck,
            color: 'from-blue-500 to-cyan-600',
        },
        {
            title: 'Members',
            value: currentWorkspace.members?.filter(m => m.role === 'member').length || 0,
            icon: User,
            color: 'from-green-500 to-emerald-600',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="glass-card p-4 flex flex-col items-center justify-center">
                        <div
                            className={`w-12 h-12 mb-2 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center`}
                        >
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-white/70 text-sm">{stat.title}</p>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default QuickStats;
