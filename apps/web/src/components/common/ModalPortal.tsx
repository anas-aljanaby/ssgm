import React from 'react';
import ReactDOM from 'react-dom';

export interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dir?: 'ltr' | 'rtl';
  labelledBy?: string;
  overlayClassName?: string;
  containerClassName?: string;
}

const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  dir,
  labelledBy,
  overlayClassName = 'fixed inset-0 bg-black/60 modal-overlay animate-fade-in',
  containerClassName = 'relative flex min-h-full items-center justify-center p-4',
}) => {
  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
      className="fixed inset-0 z-[100]"
      {...(dir ? { dir } : {})}
    >
      <div className={overlayClassName} onClick={onClose} aria-hidden="true" />
      <div className={containerClassName}>{children}</div>
    </div>,
    modalRoot
  );
};

export default ModalPortal;
