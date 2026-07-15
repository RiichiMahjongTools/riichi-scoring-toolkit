import type { Meta, StoryObj } from '@storybook/react-vite';

import { Chip } from '../index';

const meta = {
  title: 'Components/Controls/Chip',
  component: Chip,
  args: {
    children: '立直',
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Chip tone="success">成功</Chip>
      <Chip tone="warning">警告</Chip>
      <Chip tone="danger">危险</Chip>
      <Chip tone="info">信息</Chip>
    </div>
  ),
};
