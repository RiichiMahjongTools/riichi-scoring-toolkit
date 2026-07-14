import {
  Calculator,
  ClipboardList,
  GraduationCap,
  House,
  HelpCircle,
  Layers,
  NotebookTabs,
  ScrollText,
  ScanLine,
  TableProperties,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PageId =
  | 'home'
  | 'quick-score'
  | 'chinitsu'
  | 'han-fu-calculator'
  | 'fu-practice'
  | 'legacy-score'
  | 'point-practice'
  | 'yaku-list'
  | 'yaku-detail'
  | 'comeback'
  | 'table-records'
  | 'han-fu-table'
  | 'help-fu'
  | 'help-points'
  | 'hand-recognition'
  | 'tile-keyboard-demo'
  | 'placeholder'
  | 'contact';

export type ModuleStatus = 'ready' | 'placeholder';

export interface NavEntry {
  id: PageId;
  group: '计分' | '练习' | '资料' | '记录与识别';
  title: string;
  subtitle: string;
  status: ModuleStatus;
  icon: LucideIcon;
}

export const NAV_ENTRIES: NavEntry[] = [
  {
    id: 'quick-score',
    group: '计分',
    title: '快速点数计算',
    subtitle: '手牌、宝牌、场况与四麻/三麻结算',
    status: 'ready',
    icon: Calculator,
  },
  {
    id: 'han-fu-calculator',
    group: '计分',
    title: '番符点数计算',
    subtitle: '选择番符并查看庄闲荣和/自摸支付',
    status: 'ready',
    icon: TableProperties,
  },
  {
    id: 'fu-practice',
    group: '练习',
    title: '符数计算练习',
    subtitle: '手算符数、查看拆解与标准答案',
    status: 'ready',
    icon: GraduationCap,
  },
  {
    id: 'point-practice',
    group: '练习',
    title: '点数计算练习',
    subtitle: '输入总得点，可展开番符速查表',
    status: 'ready',
    icon: Target,
  },
  {
    id: 'chinitsu',
    group: '练习',
    title: '清一色听牌练习',
    subtitle: '从一到九同花色牌中选择全部听牌',
    status: 'ready',
    icon: Layers,
  },
  {
    id: 'comeback',
    group: '练习',
    title: '逆转番符练习',
    subtitle: '按分差判断各番最低符数',
    status: 'ready',
    icon: TrendingUp,
  },
  {
    id: 'yaku-list',
    group: '资料',
    title: '役种列表',
    subtitle: '现代标准役与常见役满的条件说明',
    status: 'ready',
    icon: NotebookTabs,
  },
  {
    id: 'legacy-score',
    group: '资料',
    title: '古役计算',
    subtitle: '手动选择地方役番值并按番符公式估算',
    status: 'ready',
    icon: ScrollText,
  },
  {
    id: 'help-fu',
    group: '资料',
    title: '符数帮助',
    subtitle: '和牌符、听牌符、面子符与取整规则',
    status: 'ready',
    icon: HelpCircle,
  },
  {
    id: 'help-points',
    group: '资料',
    title: '点数帮助',
    subtitle: '基本点公式、满贯级别与支付方式',
    status: 'ready',
    icon: House,
  },
  {
    id: 'table-records',
    group: '记录与识别',
    title: '面麻点数记录',
    subtitle: '本地记录流水、写入点差并支持撤销',
    status: 'ready',
    icon: ClipboardList,
  },
  {
    id: 'hand-recognition',
    group: '记录与识别',
    title: '实体手牌识别',
    subtitle: '导入照片后用牌键盘确认最终牌序',
    status: 'ready',
    icon: ScanLine,
  },
];

export const PAGE_TITLES: Record<PageId, string> = {
  home: '日麻点数',
  'quick-score': '快速点数计算',
  chinitsu: '清一色听牌练习',
  'han-fu-calculator': '番符点数计算',
  'fu-practice': '符数计算练习',
  'legacy-score': '古役点数计算',
  'point-practice': '点数计算练习',
  'yaku-list': '役种列表',
  'yaku-detail': '役种详情',
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

export function entryForPage(page: PageId) {
  return NAV_ENTRIES.find((entry) => entry.id === page);
}
