export type AutomationTrigger = 'newDonor' | 'newDonation' | 'projectStatusUpdate';
export type AutomationAction = 'sendEmail' | 'createTask' | 'notifyUser';

export interface Automation {
    id: string;
    name: { en: string; ar: string };
    trigger: AutomationTrigger;
    action: AutomationAction;
    enabled: boolean;
}

export const MOCK_AUTOMATIONS: Automation[] = [
    {
        id: 'auto-1',
        name: { en: 'New donor welcome', ar: 'ترحيب بالمانح الجديد' },
        trigger: 'newDonor',
        action: 'sendEmail',
        enabled: true,
    },
    {
        id: 'auto-2',
        name: { en: 'Donation thank-you task', ar: 'مهمة شكر على التبرع' },
        trigger: 'newDonation',
        action: 'createTask',
        enabled: true,
    },
    {
        id: 'auto-3',
        name: { en: 'Project status notify', ar: 'إشعار تحديث حالة المشروع' },
        trigger: 'projectStatusUpdate',
        action: 'notifyUser',
        enabled: false,
    },
];
