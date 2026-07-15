import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton, SurfacePanel } from '../index';

const meta = {
  title: 'Components/Feedback/SurfacePanel',
  component: SurfacePanel,
  args: {
    title: '计算完成',
    description: '这是当前流程中需要独立强调的结果。',
    tone: 'success',
    children: <strong>7,700 点</strong>,
    footer: <ActionButton size="sm">继续</ActionButton>,
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component: '只用于结果、反馈、警告、媒体预览和空状态；SurfacePanel 内禁止再嵌套 SurfacePanel。',
      },
    },
  },
} satisfies Meta<typeof SurfacePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <SurfacePanel title="普通状态">中性信息</SurfacePanel>
      <SurfacePanel title="识别提示" tone="info">本地模型正在处理。</SurfacePanel>
      <SurfacePanel title="需要确认" tone="warning">请检查输入。</SurfacePanel>
      <SurfacePanel title="无法计分" tone="danger">当前牌型没有役。</SurfacePanel>
    </div>
  ),
};
