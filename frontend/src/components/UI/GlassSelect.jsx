import {useEffect, useRef, useState} from 'react';

const GlassSelect = ({options, value, onChange}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div ref={ref} className="relative w-48">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-black text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {value || 'Select Status'}
            </button>

            {isOpen && (
                <ul className="absolute left-0 w-full mt-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg shadow-lg z-[9999]">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className="px-3 py-2 cursor-pointer hover:bg-white/30 text-black"
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default GlassSelect;