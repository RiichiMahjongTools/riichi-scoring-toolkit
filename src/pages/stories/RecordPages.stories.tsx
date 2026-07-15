import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { createPageStoryArgs, expectPageTitle, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Records',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TableRecords: Story = {
  args: { page: 'table-records' },
  play: async ({ canvasElement }) => {
    await expectPageTitle(canvasElement, '面麻点数记录');
    await expect(within(canvasElement).getByRole('heading', { name: '记录一手' })).toBeInTheDocument();
  },
};

export const TableRecordsWithHistory: Story = {
  args: { page: 'table-records' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '写入流水' }));
    await expect(canvas.getByText('南家 荣和 西家')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '撤销上一条' })).toBeEnabled();
  },
};

export const HandRecognition: Story = {
  args: { page: 'hand-recognition' },
  play: async ({ canvasElement }) => {
    await expectPageTitle(canvasElement, '实体手牌识别');
    await expect(within(canvasElement).getByText('导入照片后在本地预览')).toBeInTheDocument();
  },
};

export const HandRecognitionKeyboardOpen: Story = {
  args: { page: 'hand-recognition' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '打开牌键盘修正' }));
    await expect(await canvas.findByRole('dialog', { name: '修正实体手牌' })).toBeInTheDocument();
  },
};
