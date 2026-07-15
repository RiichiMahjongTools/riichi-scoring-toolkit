import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SegmentedControl } from '../index';

const options = [
  { value: 'east', label: '东家' },
  { value: 'south', label: '南家' },
  { value: 'west', label: '西家' },
];

function SegmentedControlExample() {
  const [value, setValue] = useState('east');
  return <SegmentedControl ariaLabel="选择自风" options={options} value={value} onChange={setValue} />;
}

const meta = {
  title: 'Components/Controls/SegmentedControl',
  component: SegmentedControl,
  args: {
    ariaLabel: '选择自风',
    options,
    value: 'east',
    onChange: () => undefined,
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <SegmentedControlExample />,
};
