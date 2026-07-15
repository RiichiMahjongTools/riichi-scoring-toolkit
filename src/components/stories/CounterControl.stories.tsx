import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { CounterControl } from '../index';

function CounterControlExample() {
  const [value, setValue] = useState(0);
  return <CounterControl ariaLabel="本场数" max={10} suffix="本场" value={value} onChange={setValue} />;
}

function VisibleLabelCounterExample() {
  const [value, setValue] = useState(2);
  return <CounterControl label="连续本场" max={10} suffix="本场" value={value} onChange={setValue} />;
}

const meta = {
  title: 'Components/Controls/CounterControl',
  component: CounterControl,
  args: {
    label: '本场数',
    value: 0,
    onChange: () => undefined,
  },
  parameters: { mobileCanvas: true },
} satisfies Meta<typeof CounterControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CounterControlExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const decrement = canvas.getByRole('button', { name: '减少本场数' });
    const increment = canvas.getByRole('button', { name: '增加本场数' });

    await expect(decrement).toBeDisabled();
    await userEvent.click(increment);
    await expect(canvas.getByText('1')).toBeInTheDocument();
    await expect(decrement).toBeEnabled();
  },
};

export const WithVisibleLabel: Story = {
  render: () => <VisibleLabelCounterExample />,
};
