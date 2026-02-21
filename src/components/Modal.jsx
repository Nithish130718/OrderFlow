import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, width = '520px' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal glass-card"
                style={{ maxWidth: width }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal__header">
                    <h2 className="modal__title">{title}</h2>
                    <button className="modal__close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="modal__body">{children}</div>
            </div>
        </div>
    );
}
