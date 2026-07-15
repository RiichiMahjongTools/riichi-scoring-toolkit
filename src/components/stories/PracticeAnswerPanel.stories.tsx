import { ArrowRight } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton, PracticeAnswerPanel } from '../index';

const meta = {
  title: 'Components/Feedback/PracticeAnswerPanel',
  component: PracticeAnswerPanel,
  args: {
    status: 'correct',
    title: '回答正确',
    streak: 4,
    userAnswer: '3番 40符',
    correctAnswer: '3番 40符',
    breakdown: <p>门前清自摸和 1 番、断幺九 1 番、平和 1 番。</p>,
    actions: <ActionButton icon={<ArrowRight aria-hidden="true" />}>下一题</ActionButton>,
  },
} satisfies Meta<typeof PracticeAnswerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Correct: Story = {};

export const Wrong: Story = {
  args: {
    status: 'wrong',
    title: '再检查一次符数',
    userAnswer: '3番 30符',
  },
};
