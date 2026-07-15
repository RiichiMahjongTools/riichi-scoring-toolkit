import { Calculator, RotateCcw } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton } from '../index';

const meta = {
  title: 'Components/Controls/ActionButton',
  component: ActionButton,
  args: {
    children: '开始计算',
    icon: <Calculator aria-hidden="true" />,
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <ActionButton variant="primary">主要操作</ActionButton>
      <ActionButton variant="secondary">次要操作</ActionButton>
      <ActionButton variant="ghost" icon={<RotateCcw aria-hidden="true" />}>重置</ActionButton>
      <ActionButton variant="gold">金色操作</ActionButton>
      <ActionButton variant="danger">危险操作</ActionButton>
      <ActionButton disabled>禁用状态</ActionButton>
    </div>
  ),
};
