import React from 'react';
import {motion} from 'framer-motion';
import {Users, FolderOpen, CheckSquare, TrendingUp} from 'lucide-react';

const StatsCard = ({title, value, icon, color, trend}) => {
    const iconMap = {
        Users,
        FolderOpen,
        CheckSquare,
        TrendingUp,
    };

    const Icon = iconMap[icon] || Users;

    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-pink-600',
        yellow: 'from-yellow-500 to-orange-500',
    };

    return (
        <motion.div
            className="neumorphic-card"
            whileHover={{scale: 1.02}}
            transition={{type: 'spring', stiffness: 300}}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-green-600 text-xs font-medium">{trend}</p>
                </div>
                <div
                    className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white"/>
                </div>
            </div>
        </motion.div>
    );
};

export default StatsCard;
