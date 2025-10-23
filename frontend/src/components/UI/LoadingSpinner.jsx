import React from 'react';
import {motion} from 'framer-motion';

const LoadingSpinner = ({
                            size = 'medium',
                            color = 'white',
                            className = '',
                            text = null
                        }) => {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const textSizeClasses = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base',
        xl: 'text-lg',
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <motion.div
                className={`${sizeClasses[size]} border-2 border-transparent border-t-${color === 'white' ? 'white' : color} rounded-full`}
                animate={{rotate: 360}}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            {text && (
                <motion.p
                    className={`mt-2 ${textSizeClasses[size]} text-${color === 'white' ? 'white' : color} opacity-80`}
                    initial={{opacity: 0}}
                    animate={{opacity: 0.8}}
                    transition={{delay: 0.2}}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingSpinner;
