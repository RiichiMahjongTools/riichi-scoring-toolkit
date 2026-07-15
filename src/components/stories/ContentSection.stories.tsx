import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton, ContentSection } from '../index';

const meta = {
  title: 'Components/Layout/ContentSection',
  component: ContentSection,
  args: {
    eyebrow: '手牌信息',
    title: '选择和牌',
    description: '用标题、留白和分割线组织连续内容，不创建新的卡片表面。',
    children: <p>普通正文、列表或表格说明放在这里。</p>,
    actions: <ActionButton size="sm">编辑</ActionButton>,
    footer: <small>最多可选择 14 张牌</small>,
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component: '适用于正文、说明和数据分区；默认只用标题与间距分组。内容本身或页面导航已经能说明用途时，应省略可见标题并补充 aria-label。仅在主题明显切换时使用顶部分割线，不给标题加下划线。',
      },
    },
  },
} satisfies Meta<typeof ContentSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CompactSeparated: Story = {
  args: {
    density: 'compact',
    eyebrow: undefined,
    separator: 'top',
    title: '紧凑分区',
    description: '仅在相邻内容需要额外层级提示时使用顶部分割线。',
  },
};

export const Untitled: Story = {
  args: {
    'aria-label': '题面手牌',
    actions: undefined,
    description: undefined,
    eyebrow: undefined,
    footer: undefined,
    title: undefined,
    children: <p>页面上下文已经足够明确，因此不再重复显示分区标题。</p>,
  },
};
