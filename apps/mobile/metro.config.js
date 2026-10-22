const path = require('node:path');
const { createRequire } = require('node:module');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const requireFromProject = createRequire(
  path.join(projectRoot, 'package.json'),
);
const config = getDefaultConfig(projectRoot);
const defaultResolveRequest = config.resolver.resolveRequest;
const moduleAliases = {
  '@tanstack/react-query': requireFromProject.resolve('@tanstack/react-query'),
  react: requireFromProject.resolve('react'),
  'react-dom': requireFromProject.resolve('react-dom'),
  'react/jsx-dev-runtime': requireFromProject.resolve('react/jsx-dev-runtime'),
  'react/jsx-runtime': requireFromProject.resolve('react/jsx-runtime'),
  'react-native': requireFromProject.resolve('react-native'),
};

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  const alias = moduleAliases[moduleName];

  if (alias) {
    return {
      filePath: alias,
      type: 'sourceFile',
    };
  }

  try {
    return resolve(context, moduleName, platform);
  } catch (error) {
    if (!moduleName.endsWith('.js')) throw error;

    return resolve(context, moduleName.slice(0, -3), platform);
  }
};

module.exports = config;
