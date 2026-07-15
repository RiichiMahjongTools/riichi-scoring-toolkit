import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import type { PageId } from '../pageModel';
import { pageStoryParameters } from './storySupport';

function NavigationHarness({ initialPage = 'quick-score' }: { initialPage?: PageId }) {
  const [page, setPage] = useState<PageId>(initialPage);
  return <AppScreen page={page} onNavigate={setPage} onShare={() => undefined} />;
}

const meta = {
  title: 'Pages/AppNavigation',
  component: NavigationHarness,
  parameters: pageStoryParameters,
} satisfies Meta<typeof NavigationHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RemembersLastPagePerSection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '古役' }));
    await expect(canvas.getByRole('button', { name: '古役' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(canvas.getByRole('button', { name: '练习' }));
    await expect(canvas.getByRole('button', { name: '符数' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: '清一色' }));

    await userEvent.click(canvas.getByRole('button', { name: '算分' }));
    await expect(canvas.getByRole('button', { name: '古役' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: '练习' }));
    await expect(canvas.getByRole('button', { name: '清一色' })).toHaveAttribute('aria-current', 'page');
  },
};

export const SecondaryPageReturnsToQuickScore: Story = {
  args: { initialPage: 'contact' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.mj-top-nav__title strong')).toHaveTextContent('联系反馈');

    await userEvent.click(canvas.getByRole('button', { name: '返回' }));
    await expect(canvasElement.querySelector('.mj-top-nav')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '快速算分' })).toHaveAttribute('aria-current', 'page');
  },
};
