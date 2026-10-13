/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-implicit-relative',
      severity: 'warn',
      comment: 'Use alias imports instead of implicit relative paths.',
      from: {},
      to: {
        path: '^[.][.][/]((?!node_modules).)*$',
      },
    },

    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Imports must resolve, including imports of missing or empty folders.',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: 'no-test-imports',
      severity: 'error',
      comment: 'Test files should not be imported from production code.',
      from: {
        path: 'src/',
      },
      to: {
        path: 'tests/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
