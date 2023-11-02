/* eslint-disable import/no-extraneous-dependencies */
const gulp = require('gulp');
const fs = require('fs-extra');
const build = require('./script/build');
const configs = require('./script/config');

const nodeEnv = process.env.NODE_ENV || 'development';
const src = './src';
const out = './dist';

console.log(`env:${nodeEnv} src:${src} out:${out}`);

if (!fs.existsSync(out)) {
  fs.mkdirSync(out);
}

/**
 * ɾ�����з����ļ���ȫ����������
 * @returns
 */
async function clean(cb) {
  // const toRemove = ['*.map'].map(cmd => `rm -rf ${cmd}`);
  // await exec.promise(`cd dist && ${toRemove.join(' && ')}`);
  await fs.emptyDir('./dist/');
  cb && cb();
}

/**
 * ͬʱ����umd��cjs��esm ���ָ�ʽ����ļ�
 */
const buildAll = gulp.series(clean, cb => {
  console.log('start build ...');
  build(configs, cb);
});

/**
 * ������cjs ��ʽ
 */
gulp.task('cjs', cb => {
  console.log('dev cjs...');
  // filter configs
  const cfg = configs.filter(c => c.output.format === 'cjs');
  build(cfg, cb);
});

/**
 * ������ esm ��ʽ
 */
gulp.task('esm', cb => {
  console.log('dev esm...');
  // filter configs
  const cfg = configs.filter(c => c.output.format === 'esm');
  build(cfg, cb);
});

/**
 * ������ umd ��ʽ
 */
gulp.task('umd', cb => {
  console.log('dev umd...');
  // filter configs
  const cfg = configs.filter(c => c.output.format === 'umd');
  build(cfg, cb);
});

gulp.task('watch', () => {
  gulp.watch(`${src}/*.js`, gulp.series([buildAll]));
});

module.default = buildAll;
module.exports = {build: buildAll};
