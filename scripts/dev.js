const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');

let server;
let isFirstBuild = true;

// Function to run the build script
function build() {
    console.log('Building site...');
    return new Promise((resolve, reject) => {
        const build = spawn('node', ['scripts/build.js'], {
            stdio: 'inherit'
        });
        
        build.on('close', (code) => {
            if (code === 0) {
                console.log('Build completed successfully');
                resolve();
            } else {
                console.error('Build failed');
                reject();
            }
        });
    });
}

// Function to start/restart the server
function startServer() {
    if (server) {
        server.kill();
    }
    
    server = spawn('node', ['scripts/serve.js'], {
        stdio: 'inherit'
    });
    
    console.log('Server restarted');
}

// Watch for file changes
const watcher = chokidar.watch([
    'src/**/*.md',
    'templates/**/*.html',
    'public/css/**/*.css'
], {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

// Handle file changes
watcher.on('ready', async () => {
    if (isFirstBuild) {
        await build();
        startServer();
        isFirstBuild = false;
        console.log('\nWatching for changes...');
    }
});

watcher.on('change', async (filepath) => {
    console.log(`\nFile ${filepath} has been changed`);
    await build();
    console.log('Watching for changes...');
});

// Handle process termination
process.on('SIGINT', () => {
    if (server) {
        server.kill();
    }
    process.exit();
}); 