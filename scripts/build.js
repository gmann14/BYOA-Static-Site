const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

async function getAllBlogPosts() {
    const blogDir = path.join(__dirname, '../src/content/blog');
    const posts = [];
    
    try {
        const files = await fs.readdir(blogDir);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(blogDir, file), 'utf8');
                const { attributes, body } = frontMatter(content);
                posts.push({
                    ...attributes,
                    slug: file.replace('.md', ''),
                    excerpt: marked(body.split('\n\n')[1] || ''),
                });
            }
        }
    } catch (err) {
        console.log('No blog posts found');
    }
    
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function generateBlogList(posts) {
    return posts.map(post => `
<article class="blog-excerpt">
    <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
    <div class="post-meta">
        <time datetime="${post.date}">${formatDate(post.date)}</time>
        <span class="author">by ${post.author}</span>
    </div>
    <div class="excerpt">
        ${post.excerpt}
    </div>
    <p class="read-more">
        <a href="/blog/${post.slug}">Read more →</a>
    </p>
</article>`).join('\n');
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

async function build() {
    // Create public directory if it doesn't exist
    await fs.ensureDir('public/dist');
    await fs.ensureDir('public/dist/blog');
    
    // Copy static assets
    await fs.copy('public/css', 'public/dist/css').catch(err => {
        console.log('No CSS files to copy yet');
    });
    
    // Get all blog posts first
    const blogPosts = await getAllBlogPosts();
    const blogList = await generateBlogList(blogPosts);
    
    // Read templates
    const baseTemplate = await fs.readFile('templates/base.html', 'utf8');
    const blogPostTemplate = await fs.readFile('templates/blog-post.html', 'utf8');
    const contactTemplate = await fs.readFile('templates/contact.html', 'utf8');
    
    async function processFile(filePath, isPost = false) {
        const content = await fs.readFile(filePath, 'utf8');
        const { attributes, body } = frontMatter(content);
        const html = marked(body);
        
        let template = baseTemplate;
        if (attributes.template === 'blog-post') {
            template = blogPostTemplate;
        } else if (attributes.template === 'contact') {
            template = contactTemplate;
        }
        
        // Replace all template variables
        let finalHtml = template;
        const vars = {
            ...attributes,
            content: html,
            date: formatDate(attributes.date),
            title: attributes.title || 'My Site',
            author: attributes.author || 'Anonymous'
        };
        
        // Replace all variables in template
        Object.entries(vars).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalHtml = finalHtml.replace(regex, value);
        });
            
        if (attributes.template === 'blog-index') {
            finalHtml = finalHtml.replace('{{blog_posts}}', blogList);
        }
        
        let outPath;
        const fileName = path.basename(filePath, '.md');
        
        if (isPost) {
            // Blog posts get .html extension
            outPath = path.join('public/dist/blog', fileName + '.html');
        } else if (attributes.template === 'page' || attributes.template === 'contact') {
            // Pages get clean URLs with index.html
            await fs.ensureDir(path.join('public/dist', fileName));
            outPath = path.join('public/dist', fileName, 'index.html');
        } else if (fileName === 'index') {
            // Homepage goes to /index.html
            outPath = path.join('public/dist', 'index.html');
        } else if (fileName === 'blog') {
            // Blog index goes to /blog.html
            outPath = path.join('public/dist', 'blog.html');
        } else {
            // Everything else gets clean URLs
            await fs.ensureDir(path.join('public/dist', fileName));
            outPath = path.join('public/dist', fileName, 'index.html');
        }
            
        await fs.writeFile(outPath, finalHtml);
        console.log(`Built: ${outPath}`);
    }
    
    // Build main pages
    const contentDir = path.join(__dirname, '../src/content');
    const files = await fs.readdir(contentDir);
    
    for (const file of files) {
        if (file.endsWith('.md')) {
            await processFile(path.join(contentDir, file));
        }
    }
    
    // Build blog posts
    const blogDir = path.join(contentDir, 'blog');
    try {
        const blogFiles = await fs.readdir(blogDir);
        for (const file of blogFiles) {
            if (file.endsWith('.md')) {
                await processFile(path.join(blogDir, file), true);
            }
        }
    } catch (err) {
        console.log('No blog posts to build');
    }
}

build().catch(console.error);