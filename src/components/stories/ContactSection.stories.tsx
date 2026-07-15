import { Github, Mail } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContactSection } from '../index';

const meta = {
  title: 'Components/Forms/ContactSection',
  component: ContactSection,
  args: {
    methods: [
      {
        id: 'mail',
        kind: 'link',
        title: '电子邮件',
        meta: 'feedback@example.com',
        description: '适合详细的问题反馈',
        href: 'mailto:feedback@example.com',
        icon: <Mail aria-hidden="true" />,
      },
      {
        id: 'github',
        kind: 'static',
        title: 'GitHub',
        meta: '提交 Issue',
        description: '适合可复现的程序问题',
        icon: <Github aria-hidden="true" />,
      },
    ],
    onSubmit: () => undefined,
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component: '由无外框内容分区、ActionList 和 FieldGroup 组合，不再形成联系方式卡片嵌套。',
      },
    },
  },
} satisfies Meta<typeof ContactSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
