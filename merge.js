const fs = require('fs');

const source = fs.readFileSync('mobyus-fitcheck.html', 'utf-8');
const dest = fs.readFileSync('fit-check.html', 'utf-8'); // Read from original so we have a clean slate

// 1. Extract styles from mobyus-fitcheck
let styleMatch = source.match(/<style>(.*?)<\/style>/s);
let styleContent = styleMatch ? styleMatch[1] : '';
styleContent = styleContent.replace(/\*\s*\{[^}]+\}/g, '');
styleContent = styleContent.replace(/body\s*\{[^}]+\}/g, '');
styleContent += "\n.fc-page-wrapper { background: var(--bg); padding-bottom: 0px; min-height: 100vh; }\n";
styleContent += ".fc-page-wrapper .hero { padding-top: 60px; }\n";
// Remove site-header styles
styleContent = styleContent.replace(/\/\* ── HEADER ── \*\/.*?\/\* ── HERO BANNER ── \*\//s, '/* ── HERO BANNER ── */');

// Replace style block
let newDest = dest.replace(/<style>.*?<\/style>/s, `<style>\n${styleContent}\n    </style>`);

// 2. Extract Hero, Main Wrap, and Sticky Footer
// Since regex with nested divs is tricky, let's use exact string indexing
const heroStart = source.indexOf('<div class="hero" id="hero-section">');
const mainWrapStart = source.indexOf('<div class="main-wrap">');
const stickyFooterStart = source.indexOf('<div class="sticky-footer" id="sticky-footer">');
const scriptStart = source.indexOf('<script>');

const heroContent = source.substring(heroStart, mainWrapStart);
const mainWrapContent = source.substring(mainWrapStart, stickyFooterStart);
// extract sticky footer up to script start
const stickyFooterContent = source.substring(stickyFooterStart, scriptStart);

const newMain = `<main class="fc-page-wrapper">\n${heroContent}\n${mainWrapContent}\n${stickyFooterContent}\n</main>`;

newDest = newDest.replace(/<main>.*?<\/main>/s, newMain);

// 3. Extract Script
const scriptInner = source.substring(scriptStart + 8, source.indexOf('</script>', scriptStart));

let modifiedScript = scriptInner.replace(/document\.getElementById\('ans-counter'\)\.textContent = [^;]+;/g, '');
modifiedScript = modifiedScript.replace(/document\.getElementById\('ans-counter'\)\.classList\.add\('done'\);/g, '');
modifiedScript = modifiedScript.replace(/document\.getElementById\('ans-counter'\)\.classList\.remove\('done'\);/g, '');

// Append my custom reset behavior or keep as is.
newDest = newDest.replace(/<script>\s*\/\/ Fit Check Logic.*?<\/script>/s, `<script>\n${modifiedScript}\n</script>`);

fs.writeFileSync('fit-check_copy.html', newDest, 'utf-8');
console.log('Merge completed successfully, properly this time!');
