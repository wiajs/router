/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const {builtinModules} = require('node:module'); // node �ڲ���
const babel = require('@rollup/plugin-babel'); // ����ת��ES6�﷨
const commonjs = require('@rollup/plugin-commonjs'); // CommonJS ģ��ת���� ES6
const resolve = require('@rollup/plugin-node-resolve'); // ����node_modules �е� CommonJS ģ��
const replace = require('@rollup/plugin-replace'); // �滻������ļ����һЩ�������� process����������ǲ����ڵģ���Ҫ���滻
const pkg = require('../package.json');

const version = process.env.VERSION || pkg.version;
const name = '@wiajs/router'; // umd ģʽ�µ�ȫ�ֱ�����

const banner = `/*!
  * wia dom v${version}
  * (c) 2015-${new Date().getFullYear()} Sibyl Yu and contributors
  * Released under the MIT License.
  */`;

const env = process.env.NODE_ENV || 'development';
const isDev = env !== 'production';

const dir = _path => path.resolve(__dirname, '../', _path);

const input = dir('./src/index.js');

/**
 * �� package.json �� builtinModules �л�ȡ����������ÿ�
 * ���� node cjs ��ʱ��Ҫ
 * umd ȫ�����������Ҫ
 */
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.devdependencies || {}),
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
  /@babel\/runtime/, // babel helpers  @babel/runtime-corejs3/
];

module.exports = [
  // browser dev
  {
    file: dir('dist/router.cmn.js'), // cjs��ʽ����˴������������
    format: 'cjs',
    browser: false,
    external,
  },
  {
    file: dir('dist/router.esm.js'), // esm��ʽ����˴������������
    format: 'esm',
    exports: 'named', // ���Ʒ�ʽ���������ģ��
    browser: false,
    external,
  },
  {
    file: dir('dist/router.js'), // umd��ʽ��es5�﷨��webֱ�Ӽ��أ��ϲ�����
    format: 'umd',
    browser: true,
    es5: true,
    name, // ȫ�����ƣ��滻 window.name
    exports: 'default', // default ��ʽ�����һ��
    external: [],
  },
].map(genConfig);

/**
 * ��������ļ���ֻ֧��input �� output�������� plugins��external ��Ч
 * plugins��external ����� input
 * @param {*} param0
 * @returns
 */
function genConfig({browser = true, es5 = false, ...cfg}) {
  const config = {
    input: {
      input,
      external: cfg.external, // �ⲿ���������������
      // �������������˳��ִ��
      plugins: [
        // node_modules �г�ES6��ת��ΪES6
        resolve({browser}), // �� node_modules �ϲ��ļ���pkg��browser�ļ��滻 mainFields: ['browser']
        commonjs(), // common ת��Ϊ es6
        // �滻�ض��ַ���
        replace({
          preventAssignment: true, // ���⸳ֵ�滻  xxx = false -> false = false
          'process.env.NODE_ENV': JSON.stringify(env),
          'process.browser': !!browser,
          __VERSION__: version,
        }),
        // ������Ҫ����es6 ת��Ϊ es5���������������������@babel/runtime-corejs3 polyfill
          es5 && // eslint-disable-line
          // babel({babelHelpers: 'bundled', presets: ['@babel/preset-env']}),
          babel({
            // 'bundled' | 'runtime' | 'inline' | 'external' Default: 'bundled'
            babelHelpers: 'runtime', // ������plugin-transform-runtime
            // sourceMaps: isDev,
            configFile: dir('babel.web.js'),
          }),
      ],
    },
    output: {
      file: cfg.file,
      format: cfg.format,
      sourcemap: isDev,
      banner,
      name: cfg.name ?? undefined,
      exports: cfg.exports ?? 'auto',
      globals: {}, // ȫ�ֱ���
      generatedCode: {
        constBindings: cfg.format !== 'umd', // var -> const
      },
    },
  };

  return config;
}
