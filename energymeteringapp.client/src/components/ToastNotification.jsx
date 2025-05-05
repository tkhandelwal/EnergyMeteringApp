// Create a new file: src/components/ToastNotification.jsx
import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

// This component will display toast notifications
const ToastNotification = ({ message, variant = 'info', onClose, autoHide = true, delay = 3000 }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        if (message) setShow(true);
    }, [message]);

    const handleClose = () => {
        setShow(false);
        if (onClose) onClose();
    };

    // If no message, don't render anything
    if (!message) return null;

    return (
        <ToastContainer position="top-end" className="p-3">
            <Toast
                show={show}
                onClose={handleClose}
                delay={delay}
                autohide={autoHide}
                bg={variant.toLowerCase()}
                className="text-white"
            >
                <Toast.Header>
                    <strong className="me-auto">
                        {variant === 'danger' ? 'Error' :
                            variant === 'success' ? 'Success' :
                                variant === 'warning' ? 'Warning' : 'Information'}
                    </strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default ToastNotification;