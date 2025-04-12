import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { default as parseMD } from 'parse-md';
import readingTime from 'reading-time';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __dir = path.resolve(path.join(__dirname, '..'));
const template_path = `${__dir}/og_templates/template.html`;

// Define image dimensions
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 600;

// Configure puppeteer options
const PUPPETEER_OPTIONS = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new', // Use the new headless mode
    executablePath: process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    timeout: 60000, // Extend timeout to 60 seconds
};

// Configure page navigation options
const NAVIGATION_OPTIONS = {
    waitUntil: 'networkidle0',
    timeout: 60000, // Extend timeout to 60 seconds
};

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dir, '/assets/img/og_assets');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Ensure templates directory exists
const TEMPLATE_DIR = path.join(__dir, '/og_templates');

/**
 * Generates an Open Graph image for a blog post
 * @param {string} post_path - Path to the markdown post file
 * @param {puppeteer.Browser} [sharedBrowser] - Optional browser instance to reuse
 */
async function generate_og_asset(post_path, sharedBrowser = null) {
    let browser = sharedBrowser;
    let ownBrowser = false;

    try {
        // Filename
        const file_name = path.basename(post_path, '.md');

        // Get text file content
        const file_content = await fs.promises.readFile(post_path, 'utf8');

        // Parse markdown
        const { metadata, content } = parseMD(file_content);
        const reading_stats = readingTime(content);

        // Make sure template file exists
        if (!fs.existsSync(template_path)) {
            createInitialTemplate();
        }

        // Read and compile the template
        const templateSource = await fs.promises.readFile(template_path, 'utf8');
        const template = handlebars.compile(templateSource);

        // Transform date
        const date = new Date(metadata.date);
        const dateShort = date.toLocaleString('en-GB', { day: "2-digit", month: 'short' }).toUpperCase();
        const year = date.getFullYear();

        // Prepare data for the template
        const data = {
            title: metadata.title,
            tldr: metadata.tldr || '',
            readingMinutes: Math.round(reading_stats.minutes),
            words: reading_stats.words,
            dateShort,
            year
        };

        // Generate HTML from template
        const html = template(data);

        // Use provided browser or launch a new one
        if (!browser) {
            browser = await puppeteer.launch(PUPPETEER_OPTIONS);
            ownBrowser = true;
        }

        const page = await browser.newPage();

        // Set viewport to match OG image dimensions
        await page.setViewport({
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            deviceScaleFactor: 2 // Increase to 2x for better quality
        });

        try {
            // Load HTML content with extended timeout
            await page.setContent(html, {
                ...NAVIGATION_OPTIONS,
                path: TEMPLATE_DIR // Used to resolve relative paths like fonts
            });

            // Wait a bit for any animations or fonts to settle
            await page.evaluate(timeout => {
                return new Promise(resolve => setTimeout(resolve, timeout));
            }, 500);

            // Take screenshot
            const outputPath = path.join(OUTPUT_DIR, `${file_name}.png`);
            await page.screenshot({
                path: outputPath,
                type: 'png',
                fullPage: false,
            });

            console.log(`Generated: ${file_name}.png`);
        } catch (pageError) {
            console.error(`Error rendering page for ${file_name}:`, pageError.message);
        } finally {
            await page.close();
        }

        // Only close browser if we created it
        if (ownBrowser && browser) {
            await browser.close();
        }
    } catch (error) {
        console.error(`Error generating OG image for ${post_path}:`, error);

        // Only close browser if we created it and there was an error
        if (ownBrowser && browser) {
            await browser.close();
        }
    }
}

async function main() {
    try {
        // Get all files in a directory
        const files = await fs.promises.readdir(`${__dir}/_posts/`);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        console.log(`Found ${markdownFiles.length} markdown files to process.`);

        // Launch a single browser instance for all generations
        const browser = await puppeteer.launch(PUPPETEER_OPTIONS);

        // Process files in batches to avoid memory issues
        const BATCH_SIZE = 5;
        for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
            const batch = markdownFiles.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(markdownFiles.length / BATCH_SIZE)}`);

            // Process each markdown file in the current batch
            const promises = batch.map(file =>
                generate_og_asset(`${__dir}/_posts/${file}`, browser)
            );

            await Promise.all(promises);
        }

        // Close the shared browser
        await browser.close();
        console.log('All Open Graph images generated successfully!');
    } catch (error) {
        console.error('Error processing markdown files:', error);
    }
}

main();