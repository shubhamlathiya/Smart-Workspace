import React from 'react';

import {useAppSelector} from "../../hooks/redux.js";
import CreateWorkspaceModal from "../Workspaces/CreateWorkspaceModal.jsx";
import InviteMemberModal from "../Workspaces/InviteMemberModal.jsx";
import CreateProjectModal from "../Projects/CreateProjectModal.jsx";
import CreateTaskModal from "../Tasks/CreateTaskModal.jsx";
import EditProfileModal from "../Profile/EditProfileModal.jsx";
import DeleteConfirmModal from "../UI/DeleteConfirmModal.jsx";
import AssignUsersModal from "../Tasks/AssignUsersModal.jsx";
import TaskDetailModal from "../Tasks/TaskDetailModal.jsx";

const ModalManager = () => {
    const {modals} = useAppSelector(state => state.ui);

    return (
        <>
            {/* Workspace Modals */}
            <CreateWorkspaceModal/>
            <InviteMemberModal/>

            {/* Project Modals */}
            <CreateProjectModal/>

            {/* Task Modals */}
            <CreateTaskModal/>
            <AssignUsersModal/>
            <TaskDetailModal/>

            {/* Profile Modals */}
            <EditProfileModal/>

            {/* Utility Modals */}
            <DeleteConfirmModal/>
        </>
    );
};

export default ModalManager;
