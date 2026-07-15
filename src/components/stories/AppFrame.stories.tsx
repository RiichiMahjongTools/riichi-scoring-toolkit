import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppFrame, SectionCard, TopNav } from '../index';

const meta = {
  title: 'Components/Layout/AppFrame',
  component: AppFrame,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AppFrame
      nav={<TopNav title="日麻点数工具" subtitle="组件预览" />}
      footer={<span>本地 Storybook 组件目录</span>}
    >
      <SectionCard title="页面内容" description="AppFrame 统一承载顶部导航、主体和页脚。">
        <p>页面模块放在这里。</p>
      </SectionCard>
    </AppFrame>
  ),
};
