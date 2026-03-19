import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Ahiseve Extension',
    permissions: ['tabs', 'scripting', 'webNavigation', 'storage'],
    host_permissions: ['*://*/*'],
  },
  vite: () => ({
    plugins: [preact(), tailwindcss()],

    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
  }),
});
