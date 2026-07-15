import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton, SectionCard } from '../index';

const meta = {
  title: 'Components/Layout/SectionCard',
  component: SectionCard,
  args: {
    eyebrow: '手牌信息',
    title: '选择和牌',
    description: '录入 14 张牌，并确认最后一张为和牌。',
    children: <p>卡片主体内容</p>,
    actions: <ActionButton size="sm">编辑</ActionButton>,
    footer: <small>最多可选择 14 张牌</small>,
  },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
  args: {
    eyebrow: '计算完成',
    title: '结果有效',
    tone: 'success',
  },
};
