// hooks/useInvitation.js
import {useState, useEffect} from 'react';
import {useAppDispatch, useAppSelector} from './redux';
import {verifyInvitation, clearInvitation} from '../features/invitation/invitationSlice';

export const useInvitation = (token) => {
    const dispatch = useAppDispatch();
    const {currentInvitation, verificationLoading, error} = useAppSelector(
        (state) => state.invitation
    );

    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

    useEffect(() => {
        if (token) {
            verifyInvitationToken();
        } else {
            dispatch(clearInvitation());
            setStatus('idle');
        }
    }, [token]);

    const verifyInvitationToken = async () => {
        if (!token) return;

        setStatus('loading');
        try {
            await dispatch(verifyInvitation(token)).unwrap();
            setStatus('success');
        } catch (error) {
            setStatus('error');
        }
    };

    const retryVerification = () => {
        verifyInvitationToken();
    };

    return {
        invitation: currentInvitation,
        isLoading: verificationLoading,
        error,
        status,
        retryVerification
    };
};