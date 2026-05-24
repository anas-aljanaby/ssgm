import type { BousalaGoal, BousalaProject, BousalaTask, BousalaDirection } from '../types';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type BousalaDemoState = {
  goals: BousalaGoal[];
  projects: BousalaProject[];
  tasks: BousalaTask[];
  direction?: BousalaDirection;
};

const DEMO_GOAL_IDS = new Set(['G1', 'G2']);
const DEMO_PROJECT_IDS = new Set(['P1', 'P2']);
const DEMO_TASK_IDS = new Set(['T1', 'T2']);
const DEMO_KPI_IDS = new Set(['G1-K1', 'G1-K2', 'G2-K1', 'G2-K2']);

export function buildInitialBousalaData(t: TranslateFn): BousalaDemoState {
  return {
    goals: [
      {
        id: 'G1',
        title: t('bousala.demoData.goals.g1.title'),
        description: t('bousala.demoData.goals.g1.description'),
        progress: 45,
        linkedProjects: ['P1'],
        responsiblePerson: 'Fatma Kaya',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        kpis: [
          {
            id: 'G1-K1',
            title: t('bousala.demoData.goals.g1.kpis.g1k1.title'),
            value: 9,
            target: 20,
            unit: t('bousala.demoData.goals.g1.kpis.g1k1.unit'),
            trend: 'up',
            lastUpdated: '2024-07-20T00:00:00Z',
          },
          {
            id: 'G1-K2',
            title: t('bousala.demoData.goals.g1.kpis.g1k2.title'),
            value: 2,
            target: 5,
            unit: t('bousala.demoData.goals.g1.kpis.g1k2.unit'),
            trend: 'stable',
            lastUpdated: '2024-07-18T00:00:00Z',
          },
        ],
      },
      {
        id: 'G2',
        title: t('bousala.demoData.goals.g2.title'),
        description: t('bousala.demoData.goals.g2.description'),
        progress: 70,
        linkedProjects: ['P2'],
        responsiblePerson: 'Ali Veli',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        kpis: [
          {
            id: 'G2-K1',
            title: t('bousala.demoData.goals.g2.kpis.g2k1.title'),
            value: 350,
            target: 500,
            unit: t('bousala.demoData.goals.g2.kpis.g2k1.unit'),
            trend: 'up',
            lastUpdated: '2024-07-22T00:00:00Z',
          },
          {
            id: 'G2-K2',
            title: t('bousala.demoData.goals.g2.kpis.g2k2.title'),
            value: 88,
            target: 90,
            unit: t('bousala.demoData.goals.g2.kpis.g2k2.unit'),
            trend: 'down',
            lastUpdated: '2024-07-15T00:00:00Z',
          },
        ],
      },
    ],
    projects: [
      {
        id: 'P1',
        title: t('bousala.demoData.projects.p1.title'),
        description: t('bousala.demoData.projects.p1.description'),
        progress: 60,
        linkedGoal: 'G1',
        linkedTasks: ['T1'],
        sourceProjectId: 'PROJ-2020-002',
      },
      {
        id: 'P2',
        title: t('bousala.demoData.projects.p2.title'),
        description: t('bousala.demoData.projects.p2.description'),
        progress: 85,
        linkedGoal: 'G2',
        linkedTasks: ['T2'],
        sourceProjectId: 'PROJ-2025-003',
      },
    ],
    tasks: [
      {
        id: 'T1',
        title: t('bousala.demoData.tasks.t1.title'),
        description: t('bousala.demoData.tasks.t1.description'),
        status: 'in-progress',
        linkedProject: 'P1',
        assignee: t('bousala.demoData.teams.marketing'),
      },
      {
        id: 'T2',
        title: t('bousala.demoData.tasks.t2.title'),
        description: t('bousala.demoData.tasks.t2.description'),
        status: 'completed',
        linkedProject: 'P2',
        assignee: t('bousala.demoData.teams.technical'),
      },
    ],
  };
}

export function localizeBousalaDemoState<T extends BousalaDemoState>(state: T, t: TranslateFn): T {
  const demo = buildInitialBousalaData(t);

  return {
    ...state,
    goals: state.goals.map((goal) => {
      if (!DEMO_GOAL_IDS.has(goal.id)) return goal;
      const demoGoal = demo.goals.find((g) => g.id === goal.id);
      if (!demoGoal) return goal;
      return {
        ...goal,
        title: demoGoal.title,
        description: demoGoal.description,
        kpis: goal.kpis?.map((kpi) => {
          if (!DEMO_KPI_IDS.has(kpi.id)) return kpi;
          const demoKpi = demoGoal.kpis?.find((k) => k.id === kpi.id);
          return demoKpi ? { ...kpi, title: demoKpi.title, unit: demoKpi.unit } : kpi;
        }),
      };
    }),
    projects: state.projects.map((project) => {
      if (!DEMO_PROJECT_IDS.has(project.id)) return project;
      const demoProject = demo.projects.find((p) => p.id === project.id);
      return demoProject ? { ...project, title: demoProject.title, description: demoProject.description } : project;
    }),
    tasks: state.tasks.map((task) => {
      if (!DEMO_TASK_IDS.has(task.id)) return task;
      const demoTask = demo.tasks.find((item) => item.id === task.id);
      return demoTask
        ? { ...task, title: demoTask.title, description: demoTask.description, assignee: demoTask.assignee }
        : task;
    }),
  };
}

export function buildKpiTrendData(t: TranslateFn) {
  return [
    { name: t('bousala.demoData.chartMonths.jan'), value: 65 },
    { name: t('bousala.demoData.chartMonths.feb'), value: 59 },
    { name: t('bousala.demoData.chartMonths.mar'), value: 80 },
    { name: t('bousala.demoData.chartMonths.apr'), value: 81 },
    { name: t('bousala.demoData.chartMonths.may'), value: 56 },
    { name: t('bousala.demoData.chartMonths.jun'), value: 55 },
    { name: t('bousala.demoData.chartMonths.jul'), value: 40 },
  ];
}

export function buildForecastHistoryData(t: TranslateFn) {
  return [
    { name: t('bousala.demoData.chartMonths.jan'), forecast: 68 },
    { name: t('bousala.demoData.chartMonths.feb'), forecast: 72 },
    { name: t('bousala.demoData.chartMonths.mar'), forecast: 71 },
    { name: t('bousala.demoData.chartMonths.apr'), forecast: 75 },
    { name: t('bousala.demoData.chartMonths.may'), forecast: 78 },
    { name: t('bousala.demoData.chartMonths.jun'), forecast: 81 },
    { name: t('bousala.demoData.chartMonths.jul'), forecast: 82 },
  ];
}
