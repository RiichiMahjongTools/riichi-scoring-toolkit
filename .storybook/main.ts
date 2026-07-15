import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  viteFinal(config) {
    const plugins = (config.plugins ?? []).flat(Infinity);
    config.plugins = plugins.filter((plugin) => {
      const pluginName = plugin && typeof plugin === 'object' && 'name' in plugin ? String(plugin.name) : '';
      return !pluginName.startsWith('vite-plugin-pwa');
    });
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: Array.from(new Set([...(config.optimizeDeps?.include ?? []), 'storybook/test'])),
    };
    return config;
  },
};

export default config;
