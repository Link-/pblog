#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createCanvas, registerFont } from 'canvas';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const POSTS_DIR = path.join(__dirname, '../_posts');
const OUTPUT_DIR = path.join(__dirname, '../assets/img/og_assets');
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 600;
const BACKGROUND_COLOR = '#f8f9fa';
const TITLE_COLOR = '#212529';
const DESCRIPTION_COLOR = '#495057';
const BORDER_COLOR = '#0d6efd';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Try to register fonts if they exist
try {
    // Try to register common fonts that might be available on the system
    registerFont(path.join(__dirname, '../assets/fonts/Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Inter-Regular.ttf'), { family: 'Inter', weight: 'normal' });
} catch (error) {
    console.log('Could not register custom fonts, falling back to system fonts');
}

/**
 * Generates an Open Graph image for a blog post
 * @param {string} title - The blog post title
 * @param {string} description - The blog post description/tldr
 * @param {string} outputPath - Path to save the image
 */
function generateOGImage(title, description, outputPath) {
    const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    // Add a border at the top
    ctx.fillStyle = BORDER_COLOR;
    ctx.fillRect(0, 0, IMAGE_WIDTH, 8);

    // Set title font
    const titleFontSize = 48;
    ctx.font = `bold ${titleFontSize}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = TITLE_COLOR;
    ctx.textAlign = 'left';

    // Draw title with word wrapping
    const maxWidth = IMAGE_WIDTH - 100; // Padding on both sides
    const words = title.split(' ');
    let line = '';
    let y = 120;

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, 50, y);
            line = word;
            y += titleFontSize * 1.2;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 50, y);

    // Set description font
    const descFontSize = 24;
    ctx.font = `${descFontSize}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = DESCRIPTION_COLOR;

    // Draw description with word wrapping
    const descWords = description.split(' ');
    line = '';
    y += titleFontSize * 2; // Space after title

    for (const word of descWords) {
        const testLine = line ? `${line} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, 50, y);
            line = word;
            y += descFontSize * 1.2;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 50, y);

    // Add a watermark
    ctx.font = `14px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = '#adb5bd';
    ctx.textAlign = 'right';
    ctx.fillText('Generated OG Image', IMAGE_WIDTH - 50, IMAGE_HEIGHT - 30);

    // Save image to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Generated: ${outputPath}`);
}

/**
 * Process all markdown files in the posts directory
 */
function processMarkdownFiles() {
    try {
        // Read all files in the posts directory
        const files = fs.readdirSync(POSTS_DIR);

        // Filter only markdown files
        const markdownFiles = files.filter(file =>
            file.endsWith('.md') || file.endsWith('.markdown')
        );

        console.log(`Found ${markdownFiles.length} markdown files`);

        // Process each markdown file
        markdownFiles.forEach(file => {
            const filePath = path.join(POSTS_DIR, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');

            // Parse frontmatter
            const { data } = matter(fileContent);

            if (!data.title || !data.tldr) {
                console.warn(`Skipping ${file}: Missing title or tldr in frontmatter`);
                return;
            }

            // Generate output filename
            const outputFileName = file.replace(/\.m(ark)?d(own)?$/, '.png');
            const outputPath = path.join(OUTPUT_DIR, outputFileName);

            // Generate the OG image
            generateOGImage(data.title, data.tldr, outputPath);
        });

        console.log('All images generated successfully!');
    } catch (error) {
        console.error('Error processing markdown files:', error);
    }
}

// Start processing
processMarkdownFiles();