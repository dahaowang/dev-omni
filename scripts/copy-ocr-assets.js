const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const projectRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(projectRoot, 'public', 'ocr');
const workerSource = require.resolve('tesseract.js/src/worker-script/browser/index.js');
const coreSource = path.dirname(require.resolve('tesseract.js-core/package.json'));
const langVersion = '4.0.0_best_int';
const languages = ['eng', 'chi_sim'];

const copyFile = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

fs.rmSync(outputRoot, { recursive: true, force: true });

const coreFiles = fs
  .readdirSync(coreSource)
  .filter((fileName) => /^tesseract-core.*\.wasm(\.js)?$/.test(fileName));

if (coreFiles.length === 0) {
  throw new Error(`No Tesseract core files found in ${coreSource}`);
}

for (const fileName of coreFiles) {
  copyFile(path.join(coreSource, fileName), path.join(outputRoot, 'core', fileName));
}

fs.mkdirSync(outputRoot, { recursive: true });
esbuild.buildSync({
  entryPoints: [workerSource],
  outfile: path.join(outputRoot, 'worker.min.js'),
  bundle: true,
  define: {
    global: 'globalThis'
  },
  format: 'iife',
  minify: true,
  platform: 'browser',
  target: 'es2020'
});

for (const language of languages) {
  const langSource = path.join(path.dirname(require.resolve(`@tesseract.js-data/${language}/package.json`)), langVersion);
  copyFile(
    path.join(langSource, `${language}.traineddata.gz`),
    path.join(outputRoot, 'lang', langVersion, `${language}.traineddata.gz`)
  );
}

console.log(`Prepared OCR assets in ${path.relative(projectRoot, outputRoot)}`);
