import { BookOpen, Calculator, GraduationCap, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PageId =
  | 'quick-score'
  | 'chinitsu'
  | 'han-fu-calculator'
  | 'fu-practice'
  | 'legacy-score'
  | 'point-practice'
  | 'yaku-list'
  | 'comeback'
  | 'table-records'
  | 'han-fu-table'
  | 'help-fu'
  | 'help-points'
  | 'hand-recognition'
  | 'tile-keyboard-demo'
  | 'placeholder'
  | 'contact';

export type AppSectionId = 'score' | 'practice' | 'reference' | 'tools';

export interface AppSectionTab {
  page: PageId;
  label: string;
}

export interface AppSection {
  id: AppSectionId;
  label: string;
  icon: LucideIcon;
  defaultPage: PageId;
  tabs: readonly AppSectionTab[];
}

export const APP_SECTIONS: readonly AppSection[] = [
  {
    id: 'score',
    label: '算分',
    icon: Calculator,
    defaultPage: 'quick-score',
    tabs: [
      { page: 'quick-score', label: '快速算分' },
      { page: 'han-fu-calculator', label: '番符换算' },
      { page: 'legacy-score', label: '古役' },
    ],
  },
  {
    id: 'practice',
    label: '练习',
    icon: GraduationCap,
    defaultPage: 'fu-practice',
    tabs: [
      { page: 'fu-practice', label: '符数' },
      { page: 'point-practice', label: '点数' },
      { page: 'chinitsu', label: '清一色' },
      { page: 'comeback', label: '逆转' },
    ],
  },
  {
    id: 'reference',
    label: '资料',
    icon: BookOpen,
    defaultPage: 'yaku-list',
    tabs: [
      { page: 'yaku-list', label: '役种' },
      { page: 'help-fu', label: '符数' },
      { page: 'help-points', label: '点数' },
      { page: 'han-fu-table', label: '点数表' },
    ],
  },
  {
    id: 'tools',
    label: '工具',
    icon: Wrench,
    defaultPage: 'table-records',
    tabs: [
      { page: 'table-records', label: '牌局记录' },
      { page: 'hand-recognition', label: '手牌识别' },
    ],
  },
];

export const PAGE_TITLES: Record<PageId, string> = {
  'quick-score': '快速点数计算',
  chinitsu: '清一色听牌练习',
  'han-fu-calculator': '番符点数计算',
  'fu-practice': '符数计算练习',
  'legacy-score': '古役点数计算',
  'point-practice': '点数计算练习',
  'yaku-list': '役种列表',
  comeback: '逆转番符练习',
  'table-records': '面麻点数记录',
  'han-fu-table': '番符点数表速查',
  'help-fu': '符数帮助',
  'help-points': '点数帮助',
  'hand-recognition': '实体手牌识别',
  'tile-keyboard-demo': '牌输入键盘',
  placeholder: '页面不可用',
  contact: '联系反馈',
};

const KNOWN_PAGES = new Set<PageId>(Object.keys(PAGE_TITLES) as PageId[]);

export interface PageResolution {
  page: PageId;
  canonicalHash?: string;
}

export function sectionForPage(page: PageId): AppSection | undefined {
  return APP_SECTIONS.find((section) => section.tabs.some((tab) => tab.page === page));
}

export function sectionById(sectionId: AppSectionId): AppSection {
  const section = APP_SECTIONS.find((candidate) => candidate.id === sectionId);
  if (!section) throw new Error(`Unknown app section: ${sectionId}`);
  return section;
}

export function defaultPageForSection(sectionId: AppSectionId): PageId {
  return sectionById(sectionId).defaultPage;
}

export function resolvePageFromHash(hash: string): PageResolution {
  const fragment = hash.replace(/^#\/?/, '');
  const queryIndex = fragment.indexOf('?');
  const rawPage = queryIndex === -1 ? fragment : fragment.slice(0, queryIndex);
  const rawQuery = queryIndex === -1 ? '' : fragment.slice(queryIndex + 1);

  if (rawPage === 'home') {
    const params = new URLSearchParams(rawQuery);
    if (params.get('contact') === '1') {
      return { page: 'contact', canonicalHash: '#/contact' };
    }
    return { page: 'quick-score', canonicalHash: '#/quick-score' };
  }

  if (rawPage === 'yaku-detail') {
    return { page: 'yaku-list', canonicalHash: '#/yaku-list' };
  }

  if (KNOWN_PAGES.has(rawPage as PageId)) {
    return { page: rawPage as PageId };
  }

  return { page: 'quick-score', canonicalHash: '#/quick-score' };
}
