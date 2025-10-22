import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Show a glass-style confirmation alert
 * @param {string} title - Alert title
 * @param {string} text - Alert message
 * @param {string} confirmText - Confirm button text
 * @param {string} confirmColor - Confirm button color
 * @returns {Promise<boolean>} - Resolves true if confirmed
 */
export const showConfirmAlert = async ({
                                           title = 'Are you sure?',
                                           text = 'This action cannot be undone.',
                                           confirmText = 'Confirm',
                                           confirmColor = '#ef4444', // red by default
                                       }) => {
    const result = await Swal.fire({
        title: `<span style="color:#fff; font-weight:600;">${title}</span>`,
        html: `<p style="color:rgba(255,255,255,0.75); font-size:14px;">${text}</p>`,
        icon: 'warning',
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        confirmButtonColor: confirmColor,
        cancelButtonColor: '#3b82f6',
        customClass: {
            popup: 'glass-popup',
            confirmButton: 'glass-confirm',
            cancelButton: 'glass-cancel',
        },
        backdrop: `
      rgba(0, 0, 0, 0.4)
      blur(8px)
    `,
    });

    return result.isConfirmed;
};

/**
 * Show a success toast-like alert
 */
export const showSuccessAlert = (message) => {
    Swal.fire({
        icon: 'success',
        title: '<span style="color:#fff;">Success</span>',
        html: `<p style="color:rgba(255,255,255,0.75); font-size:14px;">${message}</p>`,
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
        customClass: {
            popup: 'glass-popup',
            confirmButton: 'glass-confirm',
        },
        timer: 1800,
        showConfirmButton: false,
    });
};

/**
 * Show an error alert
 */
export const showErrorAlert = (message) => {
    Swal.fire({
        icon: 'error',
        title: '<span style="color:#fff;">Error</span>',
        html: `<p style="color:rgba(255,255,255,0.75); font-size:14px;">${message}</p>`,
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        confirmButtonColor: '#ef4444',
        customClass: {
            popup: 'glass-popup',
            confirmButton: 'glass-confirm',
        },
    });
};
