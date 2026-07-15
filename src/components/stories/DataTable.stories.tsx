import type { Meta, StoryObj } from '@storybook/react-vite';

import { DataTable } from '../index';
import type { DataTableColumn } from '../index';

const columns: Array<DataTableColumn<Record<string, unknown>>> = [
  { id: 'han', header: '番数', accessor: 'han', align: 'center' },
  { id: 'fu', header: '符数', accessor: 'fu', align: 'center' },
  { id: 'points', header: '子家荣和', accessor: 'points', align: 'right' },
];

const rows: Array<Record<string, unknown>> = [
  { han: '1番', fu: '30符', points: '1,000' },
  { han: '2番', fu: '40符', points: '2,600' },
  { han: '3番', fu: '40符', points: '5,200' },
  { han: '4番', fu: '40符', points: '满贯 8,000' },
];

const meta = {
  title: 'Components/Data Display/DataTable',
  component: DataTable,
  args: {
    columns,
    rows,
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { emptyText: '没有匹配记录', rows: [] },
};
