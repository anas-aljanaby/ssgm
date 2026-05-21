
import React, { useState } from 'react';
import type { COATemplate } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useToast } from '../../../../hooks/useToast';
import SettingsCard from '../SettingsCard';
import { IfrsIcon, AaoifiIcon, HybridIcon, CustomIcon } from '../../../icons/FinancialsIcons';
import { UploadIcon } from '../../../icons/ActionIcons';
import ModalPortal from '../../../common/ModalPortal';
import { XIcon } from '../../../icons/GenericIcons';

// Mock data for previews
const coaTemplatesData = {
  ifrs: {
    name: 'IFRS Standard Chart of Accounts',
    accounts: [
      { code: '1000', name: 'Assets', children: [
        { code: '1100', name: 'Current Assets', children: [{ code: '1110', name: 'Cash and Cash Equivalents' }, { code: '1120', name: 'Accounts Receivable' }] },
        { code: '1200', name: 'Non-current Assets', children: [{ code: '1210', name: 'Property, Plant, and Equipment' }] },
      ]},
      { code: '2000', name: 'Liabilities', children: [
        { code: '2100', name: 'Current Liabilities', children: [{ code: '2110', name: 'Accounts Payable' }] },
      ] },
      { code: '3000', name: 'Equity', children: [] },
      { code: '4000', name: 'Revenue', children: [] },
      { code: '5000', name: 'Expenses', children: [] },
    ]
  },
  aaoifi: {
    name: 'AAOIFI Standard Chart of Accounts',
    accounts: [
      { code: '1000', name: 'Assets (الموجودات)', children: [
        { code: '1100', name: 'Zakat Assets (الموجودات الزكوية)', children: [{ code: '1110', name: 'Cash in Fund (النقد في الصندوق)'}] },
        { code: '1200', name: 'Non-Zakat Assets (الموجودات غير الزكوية)', children: [{ code: '1210', name: 'Investment Properties (استثمارات عقارية)'}] },
      ]},
      { code: '2000', name: 'Liabilities (المطلوبات)', children: [] },
      { code: '3000', name: 'Owners\' Equity (حقوق الملكية)', children: [] },
      { code: '4000', name: 'Revenues (الإيرادات)', children: [] },
      { code: '5000', name: 'Expenses (المصروفات)', children: [] },
    ]
  },
  hybrid: {
    name: 'Hybrid Model Chart of Accounts',
    accounts: [
      { code: '1000', name: 'Assets', children: [
        { code: '1100', name: 'Current Assets', children: [] },
        { code: '1200', name: 'Restricted Funds', children: [] },
      ]},
      { code: '2000', name: 'Liabilities & Zakat Payables', children: [] },
      { code: '3000', name: 'Equity & Endowments (الوقف)', children: [] },
      { code: '4000', name: 'Revenue & Donations', children: [] },
      { code: '5000', name: 'Program & Admin Expenses', children: [] },
    ]
  }
};

const AccountTree: React.FC<{ accounts: any[], level?: number }> = ({ accounts, level = 0 }) => {
    return (
        <ul className={level > 0 ? 'pl-6 rtl:pr-6 rtl:pl-0 border-l-2 rtl:border-l-0 rtl:border-r-2 border-gray-200 dark:border-slate-700' : ''}>
            {accounts.map(account => (
                <li key={account.code} className="py-2">
                    <div className="flex items-center">
                        <span className="font-mono text-sm text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{account.code}</span>
                        <span className="font-semibold text-foreground dark:text-dark-foreground">{account.name}</span>
                    </div>
                    {account.children && account.children.length > 0 && <AccountTree accounts={account.children} level={level + 1} />}
                </li>
            ))}
        </ul>
    );
};

const PreviewModal: React.FC<{ isOpen: boolean; onClose: () => void; template: COATemplate | null }> = ({ isOpen, onClose, template }) => {
    const { t } = useLocalization();
    if (!isOpen || !template || template === 'custom') return null;

    const templateData = coaTemplatesData[template as keyof typeof coaTemplatesData];

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir="rtl">
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('financialSettings.coa.previewTitle', { name: templateData.name })}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <AccountTree accounts={templateData.accounts} />
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.close')}</button>
                </div>
            </div>
        </ModalPortal>
    );
};


const COAConfiguration: React.FC = () => {
    const { t } = useLocalization();
    const [selectedTemplate, setSelectedTemplate] = useState<COATemplate | null>('aaoifi');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const toast = useToast();

    const templates = [
        { id: 'aaoifi', title: t('financialSettings.coa.templateAaoifi'), description: t('financialSettings.coa.templateAaoifiDesc'), icon: <AaoifiIcon /> },
        { id: 'ifrs', title: t('financialSettings.coa.templateIfrs'), description: t('financialSettings.coa.templateIfrsDesc'), icon: <IfrsIcon /> },
        { id: 'hybrid', title: t('financialSettings.coa.templateHybrid'), description: t('financialSettings.coa.templateHybridDesc'), icon: <HybridIcon /> },
        { id: 'custom', title: t('financialSettings.coa.templateCustom'), description: t('financialSettings.coa.templateCustomDesc'), icon: <CustomIcon /> },
    ];
    
    const handleApply = () => {
        if (selectedTemplate) {
            toast.showSuccess(t('financialSettings.coa.templateAppliedMessage', { template: selectedTemplate.toUpperCase() }), { title: t('financialSettings.coa.templateAppliedTitle') });
        } else {
            toast.showWarning(t('financialSettings.coa.noTemplateSelectedMessage'), { title: t('financialSettings.coa.noTemplateSelectedTitle') });
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">{t('financialSettings.coa.title')}</h3>
            <SettingsCard
                title={t('financialSettings.coa.templatesTitle')}
                description={t('financialSettings.coa.templatesDesc')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id as COATemplate)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedTemplate === template.id
                                ? 'border-primary dark:border-secondary bg-primary-light/50 dark:bg-primary/10 shadow-lg'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-secondary/50 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-primary dark:text-secondary text-2xl">{template.icon}</div>
                                <div>
                                    <h4 className="font-bold text-foreground dark:text-dark-foreground">{template.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button onClick={handleApply} disabled={!selectedTemplate} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {t('financialSettings.coa.apply')}
                    </button>
                     <button
                        onClick={() => setIsPreviewOpen(true)}
                        disabled={!selectedTemplate || selectedTemplate === 'custom'}
                        className="flex-1 px-4 py-2 text-sm font-semibold text-primary dark:text-secondary-light border border-primary dark:border-secondary rounded-lg hover:bg-primary/10 dark:hover:bg-secondary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {t('financialSettings.coa.preview')}
                    </button>
                </div>
                 <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-gray-50/50 dark:bg-dark-background/20 px-2 text-sm text-gray-500">{t('financialSettings.coa.or')}</span>
                    </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                    <UploadIcon />
                    {t('financialSettings.coa.importCoa')} (CSV, XLSX)
                </button>

            </SettingsCard>
            
             <div className="flex justify-end pt-4">
                 <button className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors">
                    {t('settings.saveChanges')}
                </button>
            </div>
            <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} template={selectedTemplate} />
        </div>
    );
};

export default COAConfiguration;
