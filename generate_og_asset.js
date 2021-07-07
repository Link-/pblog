const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const parseMD = require('parse-md').default;
const readingTime = require('reading-time');
const template_path = './og_templates/template_1200x600.png';

async function generate_og_asset(post_path) {
  // Filename
  const file_name = path.basename(post_path, '.md');
  // Get text file content
  const file_content = await fs.promises.readFile(post_path, 'utf8');
  // Parse markdown
  const { metadata, content } = parseMD(file_content);
  const reading_stats = readingTime(content);
  // Load the template image
  const template = await jimp.read(template_path);
  // Load the fonts
  const title_font = await jimp.loadFont('./og_templates/BaiJamjuree-Bold.ttf.fnt');
  const tldr_font = await jimp.loadFont('./og_templates/BaiJamjuree-Medium.ttf.fnt');
  const metadata_font = await jimp.loadFont('./og_templates/BaiJamjuree-Light.ttf.fnt');

  // Calculate spacing between title and tldr and increase space if title is long
  const title_length = metadata.title;
  let y_spacing = 230;
  if (title_length > 60) {
    y_spacing = 280;
  }
  template.print(title_font, 88, 88, metadata.title, 800, y_spacing);
  template.print(tldr_font, 88, y_spacing, metadata.tldr, 800, 230);

  // Reading time
  template.print(metadata_font, 405, 470, Math.round(reading_stats.minutes));
  template.print(metadata_font, 405, 505, "min");

  // Number of words
  template.print(metadata_font, 550, 470, reading_stats.words);
  template.print(metadata_font, 550, 505, "words");

  // Transform date
  const date = new Date(metadata.date);
  // Get 3 letter month from date
  const day_month = date.toLocaleString('en-GB', { day: "2-digit", month : 'short' }).toUpperCase();
  const year = date.getFullYear();
  // Publish date
  template.print(metadata_font, 695, 470, day_month);
  template.print(metadata_font, 695, 505, year);

  // Save the image
  template.write(`./assets/img/og_assets/${file_name}.png`);
}

async function main() {
  // get all files in a directory
  const files = await fs.promises.readdir('./_posts/');
  files.forEach(file => {
    generate_og_asset(`./_posts/${file}`);
  });
};

main();