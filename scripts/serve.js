const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Remove query strings and decode URL
    let url = decodeURIComponent(req.url.split('?')[0]);
    
    // Handle root and blog index
    if (url === '/') {
        url = '/index.html';
    } else if (url === '/blog') {
        url = '/blog.html';
    }

    // Construct file path
    let filePath = path.join(__dirname, '../public/dist', url);
    
    // Handle CSS files
    if (url.endsWith('.css')) {
        filePath = path.join(__dirname, '../public', url);
    }

    const extname = path.extname(filePath) || '.html';
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
    }[extname] || 'text/plain';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // For blog posts, try adding .html extension
                if (url.startsWith('/blog/') && !url.endsWith('.html')) {
                    const blogPath = path.join(__dirname, '../public/dist', url + '.html');
                    fs.readFile(blogPath, (err, blogContent) => {
                        if (err) {
                            res.writeHead(404);
                            res.end('404 - File Not Found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(blogContent, 'utf-8');
                        }
                    });
                } else {
                    res.writeHead(404);
                    res.end('404 - File Not Found');
                }
            } else {
                res.writeHead(500);
                res.end('500 - Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 