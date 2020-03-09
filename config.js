const path = require('path');
const babel = require('rollup-plugin-babel');
// const buble = require('rollup-plugin-buble');
const cjs = require('rollup-plugin-commonjs');
const node = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');

const version = process.env.VERSION || require('./package.json').version;
const banner = `/*!
  * wia router v${version}
  * (c) ${new Date().getFullYear()} Sibyl Yu
  * @license MIT
  */`;

const env = process.env.NODE_ENV || 'development';

const resolve = _path => path.resolve(__dirname, './', _path);

module.exports = [
  // browser dev
  {
    file: resolve('dist/router.umd.js'),
    format: 'umd',
  },
  {
    file: resolve('dist/router.common.js'),
    format: 'cjs',
  },
  {
    file: resolve('dist/router.esm.js'),
    format: 'es',
  },
].map(genConfig);

function genConfig(opts) {
  const config = {
    input: {
      input: resolve('src/index.js'),
      plugins: [
        babel({exclude: /node_modules/, sourceMaps: true}),
        node(),
        cjs(),
        // 替换特定字符串
        replace({
          'process.env.NODE_ENV': JSON.stringify(env),
          __VERSION__: version,
        }),
        // babel({exclude: /node_modules/, sourceMaps: true, rootMode: 'upward'}),
      ],
      external: [], // 外部变量，不打入包中
    },
    output: {
      file: opts.file,
      format: opts.format,
      sourcemap: process.env.NODE_ENV === 'development',
      banner,
      name: '@wiajs/Router',
      globals: {}, // 全局变量
    },
  };

  // if (opts.transpile !== false) {
  //   config.input.plugins.push(
  //     babel({exclude: /node_modules/, sourceMaps: true, rootMode: 'upward'})
  //   ); // buble());
  // }

  return config;
}
