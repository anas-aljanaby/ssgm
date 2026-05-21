import React from 'react';
import ModalPortal from '../common/ModalPortal';
import BeneficiaryPortal from './BeneficiaryPortal';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose }) => {
  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/50 modal-overlay"
      containerClassName="relative min-h-full overflow-hidden"
    >
      <div className="pointer-events-none fixed inset-y-0 end-0 flex max-w-full">
        <div className="pointer-events-auto w-screen">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            <div className="absolute top-4 start-4 z-10">
              <button
                onClick={onClose}
                className="rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            <BeneficiaryPortal />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default PortalModal;