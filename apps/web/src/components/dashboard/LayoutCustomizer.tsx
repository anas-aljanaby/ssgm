import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import { XIcon } from '../icons/GenericIcons';
import { ALL_WIDGETS, PRESET_LAYOUTS, KPI_WIDGETS } from '../pages/Dashboard';
import ModalPortal from '../common/ModalPortal';

interface LayoutCustomizerProps {
    isOpen: boolean;
    onClose: () => void;
    layouts: any;
    setLayouts: (layouts: any, fromHistory?: boolean) => void;
    widgets: string[];
    setWidgets: (widgets: string[]) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const PINNED_WIDGETS = ['aiInsights', 'quickActions']; // These are not in the customizer list


const LayoutCustomizer: React.FC<LayoutCustomizerProps> = ({ isOpen, onClose, layouts, setLayouts, widgets, setWidgets, undo, redo, canUndo, canRedo }) => {
    const { t, dir } = useLocalization();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleWidgetToggle = (widgetId: string) => {
        const newWidgets = widgets.includes(widgetId)
            ? widgets.filter(w => w !== widgetId)
            : [...widgets, widgetId];
        setWidgets(newWidgets);
    };
    
    const handlePresetChange = (presetName: 'executive' | 'manager' | 'analyst' | 'custom') => {
        if (presetName === 'custom') {
            try {
                const saved = localStorage.getItem('dashboard-layouts-custom');
                if (saved) {
                    const customLayout = JSON.parse(saved);
                    setLayouts(customLayout.layouts);
                    setWidgets(customLayout.widgets);
                }
            } catch (e) { console.error(e); }
        } else {
            const preset = PRESET_LAYOUTS[presetName];
            setLayouts(preset.layouts);
            // Keep current KPI visibility, but set grid widgets from preset
            const currentVisibleKpis = widgets.filter(w => KPI_WIDGETS.includes(w));
            setWidgets([...new Set([...preset.widgets, ...currentVisibleKpis])]);
        }
    }
    
    const handleSaveCustom = () => {
        const customLayout = { layouts, widgets };
        localStorage.setItem('dashboard-layouts-custom', JSON.stringify(customLayout));
        alert(t('layoutCustomizer.alerts.saved'));
    }
    
    const handleExport = () => {
        const dataStr = JSON.stringify({ layouts, widgets }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'dashboard-layout.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = e => {
                try {
                    const imported = JSON.parse(e.target?.result as string);
                    if (imported.layouts && imported.widgets) {
                        setLayouts(imported.layouts);
                        setWidgets(imported.widgets);
                    } else {
                        alert(t('layoutCustomizer.alerts.invalidFile'));
                    }
                } catch(err) {
                    alert(t('layoutCustomizer.alerts.readError'));
                }
            };
        }
    };

    const availableWidgets = Object.entries(ALL_WIDGETS).filter(([id]) => !PINNED_WIDGETS.includes(id)); // Pinned widgets are outside grid/kpi system

    return (
        <ModalPortal
            isOpen={isOpen}
            onClose={onClose}
            dir={dir === 'rtl' ? 'rtl' : 'ltr'}
            containerClassName="relative flex min-h-full w-full items-stretch p-0"
            overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay"
        >
                    <motion.div
                        initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} h-full w-80 bg-card dark:bg-dark-card shadow-2xl flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                            <h2 className="text-lg font-bold">{t('layoutCustomizer.title')}</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-4 flex items-center justify-between border-b dark:border-slate-700">
                            <button onClick={undo} disabled={!canUndo} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">{t('layoutCustomizer.undo')}</button>
                            <button onClick={redo} disabled={!canRedo} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">{t('layoutCustomizer.redo')}</button>
                            <button onClick={handleSaveCustom} className="px-3 py-1 text-sm bg-primary text-white rounded-md">{t('layoutCustomizer.save')}</button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {/* Presets */}
                            <div>
                                <h3 className="font-semibold text-sm mb-2">{t('layoutCustomizer.presets')}</h3>
                                <select defaultValue="custom" onChange={(e) => handlePresetChange(e.target.value as any)} className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                                    <option value="executive">{t('layoutCustomizer.executive')}</option>
                                    <option value="manager">{t('layoutCustomizer.manager')}</option>
                                    <option value="analyst">{t('layoutCustomizer.analyst')}</option>
                                    <option value="custom">{t('layoutCustomizer.myCustomLayout')}</option>
                                </select>
                            </div>

                            {/* Widgets */}
                            <div>
                                <h3 className="font-semibold text-sm mb-2">{t('layoutCustomizer.widgets')}</h3>
                                <div className="space-y-2">
                                    {availableWidgets.map(([id, { nameKey }]) => (
                                        <label key={id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-800/50 rounded-md cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={widgets.includes(id)}
                                                onChange={() => handleWidgetToggle(id)}
                                                className="w-4 h-4 text-primary rounded focus:ring-primary"
                                            />
                                            <span className="text-sm">{t(nameKey)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t dark:border-slate-700 flex gap-2">
                             <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                             <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 text-sm border rounded-md">{t('layoutCustomizer.import')}</button>
                             <button onClick={handleExport} className="flex-1 px-3 py-2 text-sm border rounded-md">{t('layoutCustomizer.export')}</button>
                        </div>
                        
                        <div className="p-4 border-t dark:border-slate-700">
                            <button onClick={onClose} className="w-full px-4 py-2 bg-secondary text-white font-semibold rounded-lg">{t('layoutCustomizer.done')}</button>
                        </div>
                    </motion.div>
        </ModalPortal>
    );
};

export default LayoutCustomizer;
