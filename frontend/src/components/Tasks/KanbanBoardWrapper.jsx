// components/Tasks/KanbanBoardWrapper.jsx
import React, {useState, useEffect} from 'react';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import KanbanBoard from './KanbanBoard';

const KanbanBoardWrapper = ({projectId}) => {
    const [dndKey, setDndKey] = useState(Date.now());

    useEffect(() => {
        setDndKey(Date.now());
    }, [projectId]);

    return (
        <DndProvider backend={HTML5Backend} key={dndKey}>
            <KanbanBoard projectId={projectId}/>
        </DndProvider>
    );
};

export default KanbanBoardWrapper;