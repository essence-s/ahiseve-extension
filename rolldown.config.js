import { defineConfig } from 'rolldown';
import copy from 'rollup-plugin-copy';
import { minify } from 'rollup-plugin-esbuild';

export default defineConfig([
  {
    input: {
      popup: 'src/popup.ts',
      // content: 'src/content.ts',
      background: 'src/background.ts',
    },
    output: {
      dir: 'dist/chrome',
      format: 'es',
      entryFileNames: '[name].js',
      globals: {},
    },
    plugins: [
      copy({
        targets: [
          {
            src: [
              'public/*',
              '!public/manifest.chrome.json',
              '!public/manifest.firefox.json',
            ],
            dest: ['dist/chrome', 'dist/firefox'],
          },
          {
            src: 'public/manifest.chrome.json',
            dest: 'dist/chrome',
            rename: 'manifest.json',
          },
          {
            src: 'public/manifest.firefox.json',
            dest: 'dist/firefox',
            rename: 'manifest.json',
          },
        ],
      }),
      minify(),
    ],
  },

  {
    input: 'src/popup.ts',
    output: {
      dir: 'dist/firefox',
      format: 'iife',
      entryFileNames: '[name].js',
    },
    plugins: [minify()],
  },
  {
    input: 'src/content.ts',
    output: [
      {
        dir: 'dist/firefox',
        format: 'iife',
        entryFileNames: '[name].js',
      },
      {
        dir: 'dist/chrome',
        format: 'iife',
        entryFileNames: '[name].js',
      },
    ],
    plugins: [minify()],
  },
  {
    input: 'src/app-content.ts',
    output: [
      {
        dir: 'dist/firefox',
        format: 'iife',
        entryFileNames: '[name].js',
      },
      {
        dir: 'dist/chrome',
        format: 'iife',
        entryFileNames: '[name].js',
      },
    ],
    plugins: [minify()],
  },
  {
    input: 'src/background.ts',
    output: {
      dir: 'dist/firefox',
      format: 'iife',
      entryFileNames: '[name].js',
    },
    plugins: [minify()],
  },
]);
