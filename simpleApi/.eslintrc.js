const allowedExtensions = ['.mjs', '.js', '.ts']

module.exports = {
  extends: [
    'airbnb-base',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'eslint:recommended',
    'plugin:bun/recommended'
  ],
  plugins: ['import', 'prettier', '@typescript-eslint', 'bun'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    Bun: 'readonly',
  },
  env: {
    es6: true,
    jest: true,
    node: true,
    commonjs: true,
    bun: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: allowedExtensions,
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    'prettier/prettier': 'error',
    'bun/no-await-in-shell': 'error',
    'bun/no-sync': 'warn',

    'camelcase': 'off',
    'class-methods-use-this': 'off',

    'no-underscore-dangle': 'off',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-use-before-define': [
      'error',
      {
        variables: false,
        functions: false,
      },
    ],

    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
        peerDependencies: true,
        optionalDependencies: false,
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      allowedExtensions.reduce(
        (obj, extension) =>
          Object.assign(obj, {
            [extension.replace(/^\./, '')]: 'never',
          }),
        {},
      ),
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
        ],
      },
    ],
  },
  overrides: [
    {
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      files: ['.ts', '.d.ts'].map(extension => `**/*${extension}`),
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
      ],
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': allowedExtensions.filter(extension =>
            /ts/.test(extension),
          ),
        },
      },
      rules: {
        'no-shadow': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',

        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-shadow': ['error'],
        '@typescript-eslint/no-empty-interface': [
          'error',
          {
            allowSingleExtends: true,
          },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-use-before-define': [
          'error',
          {
            variables: false,
            functions: false,
            ignoreTypeReferences: true,
          },
        ],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        'bun/test': true
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    }
  ],
}