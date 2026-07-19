import React from 'react';
import { SparklesIcon } from '../icons/GenericIcons';
import Tooltip from './Tooltip';
import { useLocalization } from '../../hooks/useLocalization';

interface AiFabProps {
  onClick: () => void;
}

const AiFab: React.FC<AiFabProps> = ({ onClick }) => {
  const { t } = useLocalization();

  return (
    <Tooltip text={t('ai_automation.assistant.title')}>
        <button
          onClick={onClick}
          className="fixed bottom-[88px] md:bottom-8 end-4 md:end-8 z-50 w-14 h-14 bg-primary/20 dark:bg-primary/30 backdrop-blur-md border-2 border-white/20 rounded-full shadow-2xl flex items-center justify-center text-white/90 transition-all duration-300 ease-bounce-out transform hover:scale-110 hover:shadow-primary/40 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 ai-fab"
          aria-label={t('ai_automation.assistant.title')}
        >
          <SparklesIcon className="w-7 h-7 animate-pulse-glow" />
        </button>
    </Tooltip>
  );
};

export default AiFab;