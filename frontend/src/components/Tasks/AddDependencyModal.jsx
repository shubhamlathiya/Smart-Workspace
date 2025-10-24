import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {X, Search, Link} from 'lucide-react';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {addDependency} from '../../features/task/taskSlice';
import {showSuccessAlert, showErrorAlert} from '../../utils/alerts';

const AddDependencyModal = ({isOpen, onClose}) => {
    const dispatch = useAppDispatch();
    const {currentTask} = useAppSelector(state => state.task);
    const {tasks} = useAppSelector(state => state.task);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [dependencyType, setDependencyType] = useState('related');
    const [isLoading, setIsLoading] = useState(false);

    const filteredTasks = tasks.filter(task =>
        task._id !== currentTask?._id &&
        !currentTask?.dependencies?.some(dep => dep.task._id === task._id) &&
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddDependency = async () => {
        if (!selectedTask) return;

        setIsLoading(true);
        try {
            await dispatch(addDependency({
                taskId: currentTask._id,
                dependencyTaskId: selectedTask._id,
                type: dependencyType
            })).unwrap();

            showSuccessAlert('success', 'Dependency Added', 'Task dependency has been added successfully');
            onClose();
            setSelectedTask(null);
            setSearchTerm('');
        } catch (err) {
            showErrorAlert('error', 'Failed to Add Dependency', 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{scale: 0.9, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                exit={{scale: 0.9, opacity: 0}}
                className="glass-card max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <h3 className="text-lg font-semibold text-white">Add Dependency</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-5 h-5 text-white"/>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Dependency Type */}
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                            Dependency Type
                        </label>
                        <select
                            value={dependencyType}
                            onChange={(e) => setDependencyType(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                        >
                            <option value="blocks">Blocks</option>
                            <option value="blocked-by">Blocked By</option>
                            <option value="related">Related To</option>
                        </select>
                    </div>

                    {/* Task Search */}
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                            Select Task
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-white/50 absolute left-3 top-3"/>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredTasks.map(task => (
                            <div
                                key={task._id}
                                onClick={() => setSelectedTask(task)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedTask?._id === task._id
                                        ? 'bg-blue-500/20 border border-blue-500'
                                        : 'bg-white/5 hover:bg-white/10'
                                }`}
                            >
                                <p className="text-white font-medium">{task.title}</p>
                                <p className="text-white/70 text-sm">{task.status}</p>
                            </div>
                        ))}
                        {filteredTasks.length === 0 && (
                            <p className="text-white/50 text-center py-4">No tasks found</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddDependency}
                            disabled={!selectedTask || isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                        >
                            <Link className="w-4 h-4"/>
                            <span>{isLoading ? 'Adding...' : 'Add Dependency'}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AddDependencyModal;