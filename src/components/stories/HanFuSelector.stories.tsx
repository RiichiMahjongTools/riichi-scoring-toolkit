import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { HanFuSelector, SectionCard } from '../index';

const calculatorHanOptions = [1, 2, 3, 4, 5];
const calculatorFuOptions = [20, 25, 30, 40, 50];

function CalculatorSelectorExample({ disabledFuValues = [] }: { disabledFuValues?: number[] }) {
  const [han, setHan] = useState(3);
  const [fu, setFu] = useState(40);
  return (
    <SectionCard title="选择番数与符数">
      <HanFuSelector
        disabledFuValues={disabledFuValues}
        fu={fu}
        fuOptions={calculatorFuOptions}
        han={han}
        hanOptions={calculatorHanOptions}
        title={null}
        onFuChange={setFu}
        onHanChange={setHan}
      />
    </SectionCard>
  );
}

function FullRangeSelectorExample() {
  const [han, setHan] = useState(3);
  const [fu, setFu] = useState(40);
  return <HanFuSelector fu={fu} han={han} onFuChange={setFu} onHanChange={setHan} />;
}

const meta = {
  title: 'Components/Mahjong/HanFuSelector',
  component: HanFuSelector,
  args: {
    fu: 40,
    han: 3,
    onFuChange: () => undefined,
    onHanChange: () => undefined,
  },
  parameters: { mobileCanvas: true },
} satisfies Meta<typeof HanFuSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CalculatorSelectorExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fourHan = canvas.getByRole('button', { name: '4番' });
    const fiftyFu = canvas.getByRole('button', { name: '50符' });

    await userEvent.click(fourHan);
    await userEvent.click(fiftyFu);

    await expect(fourHan).toHaveAttribute('aria-pressed', 'true');
    await expect(fiftyFu).toHaveAttribute('aria-pressed', 'true');
  },
};

export const DisabledCombinations: Story = {
  render: () => <CalculatorSelectorExample disabledFuValues={[20, 25]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: '20符' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '25符' })).toBeDisabled();
  },
};

export const FullRange: Story = {
  render: () => <FullRangeSelectorExample />,
};
