const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Remove query strings and decode URL
    let url = decodeURIComponent(req.url.split('?')[0]);
    
    // Remove trailing slash if present
    if (url.endsWith('/') && url !== '/') {
        url = url.slice(0, -1);
    }
    
    // Handle root and special cases
    if (url === '/') {
        url = '/index.html';
    } else if (url === '/blog') {
        url = '/blog.html';
    } else if (!url.includes('.')) {
        // For clean URLs like /about or /faq, try the index.html in that directory
        url = `${url}/index.html`;
    }

    // Construct file path
    let filePath = path.join(__dirname, '../public/dist', url);
    
    // Handle CSS files
    if (url.endsWith('.css')) {
        filePath = path.join(__dirname, '../public', url);
    }

    console.log('Requested URL:', url);
    console.log('Looking for file:', filePath);

    // Check if file exists before trying to read it
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File not found:', filePath);
            res.writeHead(404);
            res.end('404 - File Not Found');
            return;
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                console.error('Error reading file:', error.code, filePath);
                res.writeHead(500);
                res.end(`500 - Internal Server Error: ${error.code}`);
            } else {
                const extname = path.extname(filePath);
                const contentType = {
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'text/javascript',
                    '.png': 'image/png',
                    '.jpg': 'image/jpg',
                }[extname] || 'text/plain';

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 