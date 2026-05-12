const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /\bemerald\b/g, replacement: 'indigo' },
  { regex: /\blime\b/g, replacement: 'cyan' },
  { regex: /\bteal\b/g, replacement: 'blue' },
  { regex: /psl-deep-green/g, replacement: 'theme-deep-bg' },
  { regex: /psl-mid-green/g, replacement: 'theme-mid-bg' },
  { regex: /psl-panel-green/g, replacement: 'theme-panel-bg' },
  { regex: /psl-panel-border/g, replacement: 'theme-panel-border' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Replacement complete.');
