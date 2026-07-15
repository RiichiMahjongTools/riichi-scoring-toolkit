import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from '../index';

const meta = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  args: {
    title: '输入提示',
    children: '请选择完整手牌后再开始计算。',
    icon: <Info aria-hidden="true" />,
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InfoMessage: Story = {};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, width: 420, maxWidth: '90vw' }}>
      <Alert icon={<Info aria-hidden="true" />} title="信息" tone="info">补充说明内容。</Alert>
      <Alert icon={<CheckCircle2 aria-hidden="true" />} title="成功" tone="success">计算已经完成。</Alert>
      <Alert icon={<TriangleAlert aria-hidden="true" />} title="警告" tone="warning">请检查输入内容。</Alert>
      <Alert icon={<AlertCircle aria-hidden="true" />} title="错误" tone="danger">牌型不符合规则。</Alert>
    </div>
  ),
};
