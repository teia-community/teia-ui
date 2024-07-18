// InfoModal.tsx
import React, { useEffect } from 'react';
import styles from '@style'

interface InfoModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;  // Function to toggle visibility
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, title, content, onClose }) => {
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (event.target === document.getElementById('modal-overlay')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div id="modal-overlay" className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <div>{content}</div>
      </div>
    </div>
  );
};

export default InfoModal;
