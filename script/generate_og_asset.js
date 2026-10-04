#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handlebars from 'handlebars';
import parseMD from 'parse-md';
import puppeteer from 'puppeteer';
import readingTime from 'reading-time';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');
const POSTS_DIR = path.join(ROOT_DIR, '_posts');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'og_templates', 'template.html');
const PORTRAIT_PATH = path.join(ROOT_DIR, 'assets', 'portfolio.jpeg');
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, 'assets', 'img', 'og_assets');
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const FORCE = process.argv.includes('--force');

function asDataUri(filePath) {
  const extension = path.extname(filePath).slice(1);
  const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function normalizeCategories(categories) {
  if (Array.isArray(categories)) return categories;
  if (typeof categories === 'string') return categories.split(/\s+/).filter(Boolean);
  return [];
}

function truncate(text, length) {
  if (!text || text.length <= length) return text || '';
  const shortened = text.slice(0, length + 1).replace(/\s+\S*$/, '');
  return `${shortened}...`;
}

function titleFontSize(title) {
  if (title.length > 92) return 50;
  if (title.length > 70) return 56;
  if (title.length > 48) return 64;
  return 72;
}

function dateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid post date: ${value}`);
  }

  return {
    dateLabel: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    year: date.getUTCFullYear(),
  };
}

function defaultImagePath(postFile) {
  return `/assets/img/og_assets/${path.basename(postFile, path.extname(postFile))}.png`;
}

function ensureImageMetadata(postPath, source, imagePath) {
  const frontMatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatterMatch) {
    throw new Error(`Missing front matter: ${postPath}`);
  }

  const frontMatter = frontMatterMatch[1];
  const imageLine = /^image:\s*(.*)$/m.exec(frontMatter);
  if (imageLine && imageLine[1].trim() && imageLine[1].trim() !== 'tbd') return source;

  const updatedFrontMatter = imageLine
    ? frontMatter.replace(/^image:\s*.*$/m, `image: ${imagePath}`)
    : `${frontMatter}\nimage: ${imagePath}`;

  const updatedSource = source.replace(frontMatterMatch[0], `---\n${updatedFrontMatter}\n---`);
  fs.writeFileSync(postPath, updatedSource);
  console.log(`Updated image metadata: ${path.relative(ROOT_DIR, postPath)}`);
  return updatedSource;
}

function outputPathFor(imagePath, postFile) {
  if (!imagePath.startsWith('/') || !imagePath.toLowerCase().endsWith('.png')) {
    return path.join(DEFAULT_OUTPUT_DIR, `${path.basename(postFile, path.extname(postFile))}.png`);
  }

  const outputPath = path.resolve(ROOT_DIR, imagePath.slice(1));
  const relative = path.relative(ROOT_DIR, outputPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Image path escapes repository: ${imagePath}`);
  }
  return outputPath;
}

async function renderImage(browser, template, post) {
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      deviceScaleFactor: 1,
    });
    await page.setContent(template(post), { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const description = document.querySelector('.description').getBoundingClientRect();
      const footer = document.querySelector('.footer').getBoundingClientRect();
      return {
        descriptionBottom: description.bottom,
        footerTop: footer.top,
      };
    });
    if (layout.descriptionBottom > layout.footerTop - 12) {
      throw new Error(`Thumbnail content overlaps for: ${post.title}`);
    }
    await fs.promises.mkdir(path.dirname(post.outputPath), { recursive: true });
    await page.screenshot({
      path: post.outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
    });
  } finally {
    await page.close();
  }
}

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) throw new Error(`Missing template: ${TEMPLATE_PATH}`);
  if (!fs.existsSync(PORTRAIT_PATH)) throw new Error(`Missing portrait: ${PORTRAIT_PATH}`);

  const template = handlebars.compile(await fs.promises.readFile(TEMPLATE_PATH, 'utf8'));
  const portraitDataUri = asDataUri(PORTRAIT_PATH);
  const files = (await fs.promises.readdir(POSTS_DIR))
    .filter((file) => /\.md(?:own)?$/i.test(file))
    .sort();

  const posts = [];
  for (const file of files) {
    const postPath = path.join(POSTS_DIR, file);
    let source = await fs.promises.readFile(postPath, 'utf8');
    let { metadata, content } = parseMD(source);

    if (!metadata.title || !metadata.date) {
      throw new Error(`${file} requires title and date front matter`);
    }

    const fallbackImagePath = defaultImagePath(file);
    source = ensureImageMetadata(postPath, source, fallbackImagePath);
    ({ metadata, content } = parseMD(source));

    const imagePath = metadata.image && metadata.image !== 'tbd'
      ? metadata.image
      : fallbackImagePath;
    const outputPath = outputPathFor(imagePath, file);
    if (!FORCE && fs.existsSync(outputPath)) continue;

    const readingStats = readingTime(content);
    const categories = normalizeCategories(metadata.categories)
      .slice(0, 3)
      .map((category) => category.replaceAll('-', ' '));

    posts.push({
      title: String(metadata.title),
      description: truncate(metadata.tldr || 'Notes from experience in software, systems, and engineering leadership.', 190),
      titleFontSize: titleFontSize(String(metadata.title)),
      readingMinutes: Math.max(1, Math.round(readingStats.minutes)),
      categories,
      portraitDataUri,
      outputPath,
      relativeOutputPath: path.relative(ROOT_DIR, outputPath),
      ...dateParts(metadata.date),
    });
  }

  if (!posts.length) {
    console.log(`All ${files.length} social thumbnails already exist.`);
    return;
  }

  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.platform === 'darwin' && fs.existsSync(macChrome) ? macChrome : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 60000,
  });

  try {
    for (const [index, post] of posts.entries()) {
      await renderImage(browser, template, post);
      console.log(`[${index + 1}/${posts.length}] Generated ${post.relativeOutputPath}`);
    }
  } finally {
    await browser.close();
  }

  console.log(`Generated ${posts.length} social thumbnail${posts.length === 1 ? '' : 's'}.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
