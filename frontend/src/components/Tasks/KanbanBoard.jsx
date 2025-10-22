import React, { useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, MessageCircle, Clock, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useSocket, useProjectSocket, useSocketEvent } from '../../hooks/useSocket';
import LoadingSpinner from '../UI/LoadingSpinner';
import { updateTask, updateTaskInList } from '../../features/task/taskSlice.jsx';
import { openModal } from '../../features/ui/uiSlice.jsx';

// --- Draggable Task ---
const DraggableTask = ({ task, index }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'task',
        item: { id: task._id, index, status: task.status },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [task._id, task.status]);

    return (
        <motion.div
            ref={drag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            className={`mb-3 cursor-pointer transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        >
            <TaskCard task={task} />
        </motion.div>
    );
};

// --- Task Card ---
const TaskCard = ({ task }) => {
    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-green-500/20 text-green-400 border-green-500/30',
            medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return colors[priority] || colors.medium;
    };

    const formatDate = (date) => {
        if (!date) return null;
        const taskDate = new Date(date);
        const now = new Date();
        const diffTime = taskDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Overdue', color: 'text-red-400' };
        if (diffDays === 0) return { text: 'Due today', color: 'text-orange-400' };
        if (diffDays <= 3) return { text: `Due in ${diffDays} days`, color: 'text-yellow-400' };
        return { text: taskDate.toLocaleDateString(), color: 'text-white/70' };
    };

    return (
        <div className="bg-white/10 backdrop-blur-md p-4 border border-white/20 rounded-xl hover:border-white/30 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-white text-sm line-clamp-2 flex-1 mr-2">
                    {task.title}
                </h4>
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                    )}`}
                >
          {task.priority}
        </span>
            </div>

            {task.description && (
                <p className="text-white/70 text-xs mb-3 line-clamp-2">{task.description}</p>
            )}

            {task.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="bg-blue-400/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-400/30"
                        >
              {tag}
            </span>
                    ))}
                    {task.tags.length > 3 && (
                        <span className="text-white/50 text-xs">+{task.tags.length - 3}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-white/70">
                <div className="flex items-center space-x-3">
                    {task.comments?.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3 text-white/70" />
                            <span>{task.comments.length}</span>
                        </div>
                    )}
                    {task.dueDate && (
                        <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-white/70" />
                            <span className={formatDate(task.dueDate)?.color}>
                {formatDate(task.dueDate)?.text}
              </span>
                        </div>
                    )}
                </div>

                {task.assignedTo?.length > 0 && (
                    <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-white/70" />
                        <span>{task.assignedTo.length}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Droppable Column ---
const DroppableColumn = ({ column, tasks, onDrop, onAddTask }) => {
    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: 'task',
            drop: (item) => onDrop(item, column.id),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
            }),
        }),
        [column.id, onDrop]
    );

    const getColumnColor = (color) => {
        const colors = {
            gray: 'from-gray-500 to-gray-600',
            blue: 'from-blue-500 to-blue-600',
            yellow: 'from-yellow-500 to-yellow-600',
            green: 'from-green-500 to-green-600',
        };
        return colors[color] || colors.gray;
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getColumnColor(column.color)}`} />
                    <h3 className="font-semibold text-white">{column.title}</h3>
                    <span className="bg-white/10 text-white/70 text-sm px-2 py-1 rounded-full">
            {tasks.length}
          </span>
                </div>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <MoreVertical className="w-4 h-4 text-white/70" />
                </button>
            </div>

            <div
                ref={drop}
                className={`flex-1 min-h-96 p-3 rounded-lg transition-all duration-200 ${
                    isOver
                        ? 'bg-blue-500/10 border-2 border-blue-500/30 border-dashed'
                        : 'bg-white/5 border border-white/10'
                }`}
            >
                <AnimatePresence>
                    {tasks.map((task, index) => (
                        <DraggableTask key={task._id} task={task} index={index} />
                    ))}
                </AnimatePresence>

                <motion.button
                    onClick={onAddTask}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-white/50 hover:text-white hover:border-white/30 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Task</span>
                </motion.button>
            </div>
        </div>
    );
};

// --- Main Kanban Board ---
const KanbanBoard = ({ projectId }) => {
    const dispatch = useAppDispatch();
    const { kanbanColumns, isLoading } = useAppSelector((state) => state.task);
    const { user } = useAppSelector((state) => state.auth);
    const { socketService } = useSocket();

    // Join project room
    useProjectSocket(projectId);

    // Listen for task updates from socket
    useSocketEvent('task_updated', (task) => {
        if (task.projectId === projectId) {
            dispatch(updateTaskInList(task));
        }
    });

    // Columns definition
    const columns = useMemo(() => [
        { id: 'todo', title: 'To Do', color: 'gray' },
        { id: 'in-progress', title: 'In Progress', color: 'blue' },
        { id: 'review', title: 'Review', color: 'yellow' },
        { id: 'completed', title: 'Completed', color: 'green' },
    ], []);

    // Handle drag & drop
    const handleDrop = async (item, newStatus) => {
        if (item.status === newStatus) return;

        const taskId = item.id;

        // Optimistic UI update
        dispatch(updateTaskInList({ _id: taskId, status: newStatus }));
        dispatch(updateTask({ taskId, updateData: { status: newStatus } }));

        // Emit socket event
        if (socketService) {
            socketService.emitTaskUpdate({
                projectId,
                taskId,
                status: newStatus,
                updatedBy: user.name,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="large" text="Loading tasks..." />
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
                    {columns.map((column) => (
                        <DroppableColumn
                            key={column.id}
                            column={column}
                            tasks={kanbanColumns[column.id] || []}
                            onDrop={handleDrop}
                            onAddTask={() => dispatch(openModal('createTask'))}
                        />
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};

export default KanbanBoard;
