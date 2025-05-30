const chokidar = require('chokidar');
const { exec } = require('child_process');

// Define commands for different file extensions
const commands = {
	'.ts': 'tsc',
	'.css': 'npx tailwindcss -i ./tailwind.css -o ./dist/tailwind.css',
	'.html': 'npx tailwindcss -i ./tailwind.css -o ./dist/tailwind.css'
	// Add more file extensions and commands as needed
};

// Watcher configuration
const watcher = chokidar.watch('**/*.*', {
	ignored: /node_modules/, // ignore node_modules folder
	persistent: true,
	ignoreInitial: true // ignore initial files scanned
});

// Log file changes
watcher.on('change', (path) => {
	console.log(`File ${path} has been changed`);

	// Determine file extension
	const extension = path.substring(path.lastIndexOf('.'));

	// Execute corresponding command if defined
	if (commands[extension]) {
		const command = commands[extension].replace('{}', path);
		console.log(`Executing command: ${command}`);
		exec(command, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing command: ${error}`);
				return;
			}
			console.log(stdout);
			console.error(stderr);
		});
	} else {
		console.log(`No command defined for ${extension} files`);
	}
});

// Handle errors
watcher.on('error', (error) => {
	console.error(`Watcher error: ${error}`);
});

// Handle process exit
process.on('SIGINT', () => {
	watcher.close();
	process.exit(0);
});