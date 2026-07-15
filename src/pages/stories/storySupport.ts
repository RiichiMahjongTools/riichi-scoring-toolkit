import { expect, fn } from 'storybook/test';

import type { AppScreenProps } from '../../AppScreen';

export const pageStoryParameters = {
  layout: 'fullscreen',
  mobileCanvas: true,
  docs: {
    description: {
      component: 'Canvas 直接渲染生产环境的 AppScreen 与真实页面；导航在 Storybook 中使用模拟回调，不会触发浏览器跳转。',
    },
  },
} as const;

export function createPageStoryArgs(): Pick<AppScreenProps, 'onNavigate' | 'onShare'> {
  return {
    onNavigate: fn(),
    onShare: fn(),
  };
}

export async function expectPageTitle(canvasElement: HTMLElement, title: string) {
  await expect(canvasElement.querySelector('.mj-top-nav__title strong')).toHaveTextContent(title);
}

export async function expectNoPrimaryHeader(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector('.mj-top-nav')).not.toBeInTheDocument();
}
