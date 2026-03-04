const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components')
];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

let filesToProcess = [];
targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        filesToProcess = getAllFiles(dir, filesToProcess);
    }
});

const replacements = [
    { regex: /bg-cream(?!-dark)(\s|")/g, replace: 'bg-cream dark:bg-dark-bg$1' },
    { regex: /bg-white(\s|")/g, replace: 'bg-white dark:bg-dark-card$1' },
    { regex: /text-warm-gray-700(\s|")/g, replace: 'text-warm-gray-700 dark:text-dark-text$1' },
    { regex: /text-warm-gray-600(\s|")/g, replace: 'text-warm-gray-600 dark:text-dark-text$1' },
    { regex: /text-warm-gray-500(\s|")/g, replace: 'text-warm-gray-500 dark:text-dark-muted$1' },
    { regex: /text-warm-gray-400(\s|")/g, replace: 'text-warm-gray-400 dark:text-dark-muted$1' },
    { regex: /border-warm-gray-100(\s|")/g, replace: 'border-warm-gray-100 dark:border-dark-border$1' },
    { regex: /border-warm-gray-50(\s|")/g, replace: 'border-warm-gray-50 dark:border-dark-border$1' },
    { regex: /border-warm-gray-200(\s|")/g, replace: 'border-warm-gray-200 dark:border-dark-border$1' },
    { regex: /bg-peach-100(\s|")/g, replace: 'bg-peach-100 dark:bg-dark-peach-subtle$1' },
    { regex: /bg-peach-50(\s|")/g, replace: 'bg-peach-50 dark:bg-dark-peach-subtle$1' },
    { regex: /bg-warm-gray-50(\s|")/g, replace: 'bg-warm-gray-50 dark:bg-dark-elevated$1' },
    { regex: /bg-warm-gray-100(\s|")/g, replace: 'bg-warm-gray-100 dark:bg-dark-elevated$1' },
    { regex: /bg-green-50(\s|")/g, replace: 'bg-green-50 dark:bg-green-900\/20$1' },
    { regex: /bg-red-50(\s|")/g, replace: 'bg-red-50 dark:bg-red-900\/20$1' },
];

let changedCount = 0;

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
    });

    // special case for index.tsx active collections
    content = content.replace(/bg-white border border-warm-gray-100 dark:bg-dark-card dark:border-dark-border/g, 'bg-white border border-warm-gray-100 dark:bg-dark-card dark:border-dark-border'); // already handled

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log('Updated classes in:', path.basename(file));
    }
});

console.log(`Updated ${changedCount} files with dark mode classes.`);
