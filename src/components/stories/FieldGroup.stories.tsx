import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Chip, FieldGroup } from '../index';

function Example() {
  const [mode, setMode] = useState<'yonma' | 'sanma'>('yonma');
  return (
    <FieldGroup description="相关控件使用 fieldset 与 legend 建立语义关系。" legend="场况与规则">
      <div className="mj-chip-row">
        <Chip selected={mode === 'yonma'} onClick={() => setMode('yonma')}>四麻</Chip>
        <Chip selected={mode === 'sanma'} onClick={() => setMode('sanma')}>三麻</Chip>
      </div>
    </FieldGroup>
  );
}

const meta = {
  title: 'Components/Forms/FieldGroup',
  component: FieldGroup,
  args: {
    legend: '场况与规则',
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component: '适用于一组共同完成同一输入任务的控件；legend 依靠字重和间距建立层级，不使用标题下划线。页面或题干已经提供相同上下文时，可用 legendVisibility="sr-only" 去掉重复的可见标题，同时保留 fieldset 的可访问名称。不要拿它包裹纯正文或结果反馈。',
      },
    },
  },
} satisfies Meta<typeof FieldGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: '场况与规则' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '三麻' }));
    await expect(canvas.getByRole('button', { name: '三麻' })).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Compact: Story = {
  render: () => <FieldGroup density="compact" legend="紧凑输入组"><input aria-label="示例输入" /></FieldGroup>,
};

export const ScreenReaderOnlyLegend: Story = {
  render: () => (
    <FieldGroup legend="题面手牌" legendVisibility="sr-only">
      <input aria-label="示例手牌输入" />
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: '题面手牌' })).toBeInTheDocument();
  },
};
