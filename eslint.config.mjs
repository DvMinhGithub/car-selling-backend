import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default defineConfig([
  js.configs.recommended,
  {
    plugins: {
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },

    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
    },
  },
]);
