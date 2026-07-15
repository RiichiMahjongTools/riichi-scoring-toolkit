import { Github, Mail } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContactPanel } from '../index';

const meta = {
  title: 'Components/Panels/ContactPanel',
  component: ContactPanel,
  args: {
    methods: [
      {
        id: 'mail',
        label: '电子邮件',
        value: 'feedback@example.com',
        description: '适合详细的问题反馈',
        href: 'mailto:feedback@example.com',
        icon: <Mail aria-hidden="true" />,
      },
      {
        id: 'github',
        label: 'GitHub',
        value: '提交 Issue',
        description: '适合可复现的程序问题',
        icon: <Github aria-hidden="true" />,
      },
    ],
    onSubmit: () => undefined,
  },
} satisfies Meta<typeof ContactPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
