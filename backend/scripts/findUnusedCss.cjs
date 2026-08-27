const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../../frontend/src/index.css');
const componentsPath = path.join(__dirname, '../../frontend/src/components');

const css = fs.readFileSync(cssPath, 'utf8');
const classRegex = /\.([a-zA-Z0-9_-]+)(?=[^{}]*\{)/g;
let match;
const classes = new Set();
while ((match = classRegex.exec(css)) !== null) {
  classes.add(match[1]);
}

const ignoreClasses = ['light', 'dark', 'hover', 'focus', 'active', 'visited'];
const usedClasses = new Set();

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const cls of classes) {
        if (content.includes(cls)) {
          usedClasses.add(cls);
        }
      }
    }
  }
}

searchDir(componentsPath);

// Also search in App.jsx and main.jsx
const rootFiles = ['App.jsx', 'main.jsx'];
for (const file of rootFiles) {
  const fullPath = path.join(__dirname, '../../frontend/src', file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const cls of classes) {
      if (content.includes(cls)) {
        usedClasses.add(cls);
      }
    }
  }
}

const unusedClasses = [...classes].filter(cls => !usedClasses.has(cls) && !ignoreClasses.includes(cls));
console.log('Unused classes:');
console.log(unusedClasses.join(', '));
