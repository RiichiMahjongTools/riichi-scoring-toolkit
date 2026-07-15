import { BookOpen, Calculator, GraduationCap, Wrench } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BottomTabBar, ModuleTabs } from '../index';

function NavigationTabsPreview({
  onBottomSelect,
  onModuleSelect,
}: {
  onBottomSelect: (section: string) => void;
  onModuleSelect: (page: string) => void;
}) {
  return (
    <div style={{ minHeight: 260, background: 'var(--mj-color-bg)', paddingTop: 24 }}>
      <ModuleTabs
        activeId="han-fu-calculator"
        ariaLabel="算分功能"
        items={[
          { id: 'quick-score', label: '快速算分' },
          { id: 'han-fu-calculator', label: '番符换算' },
          { id: 'legacy-score', label: '古役' },
        ]}
        onSelect={onModuleSelect}
      />
      <div style={{ height: 140 }} />
      <BottomTabBar
        activeId="score"
        items={[
          { id: 'score', label: '算分', icon: <Calculator aria-hidden="true" /> },
          { id: 'practice', label: '练习', icon: <GraduationCap aria-hidden="true" /> },
          { id: 'reference', label: '资料', icon: <BookOpen aria-hidden="true" /> },
          { id: 'tools', label: '工具', icon: <Wrench aria-hidden="true" /> },
        ]}
        onSelect={onBottomSelect}
      />
    </div>
  );
}

const meta = {
  title: 'Components/Layout/NavigationTabs',
  component: NavigationTabsPreview,
  args: {
    onBottomSelect: fn(),
    onModuleSelect: fn(),
  },
  parameters: { layout: 'fullscreen', mobileCanvas: true },
} satisfies Meta<typeof NavigationTabsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation', { name: '算分功能' })).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: '主要功能' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '番符换算' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: '算分' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getAllByRole('button')).toHaveLength(7);

    await userEvent.click(canvas.getByRole('button', { name: '古役' }));
    await userEvent.click(canvas.getByRole('button', { name: '练习' }));
    await expect(args.onModuleSelect).toHaveBeenCalledWith('legacy-score');
    await expect(args.onBottomSelect).toHaveBeenCalledWith('practice');
  },
};
