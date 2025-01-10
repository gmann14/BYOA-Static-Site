const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

async function build() {
    // Create public directory if it doesn't exist
    await fs.ensureDir('public/dist');
    
    // Copy static assets
    await fs.copy('public/css', 'public/dist/css').catch(err => {
        console.log('No CSS files to copy yet');
    });
    
    // Read template
    const template = await fs.readFile('templates/base.html', 'utf8');
    
    // Build markdown files
    const contentDir = path.join(__dirname, '../src/content');
    const files = await fs.readdir(contentDir);
    
    for (const file of files) {
        if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(contentDir, file), 'utf8');
            const { attributes, body } = frontMatter(content);
            const html = marked(body);
            
            const page = template
                .replace('{{title}}', attributes.title || 'My Site')
                .replace('{{content}}', html);
            
            const outFile = file.replace('.md', '.html');
            const outPath = path.join('public/dist', outFile);
            await fs.writeFile(outPath, page);
            console.log(`Built: ${outFile}`);
        }
    }
}

build().catch(console.error); 