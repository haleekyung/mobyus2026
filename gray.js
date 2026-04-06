const fs = require('fs');

let css = fs.readFileSync('fit-check_copy.html', 'utf-8');

// Replace CSS Variables
css = css.replace(/--primary: #[0-9A-Fa-f]+;/g, '--primary: #4A4A4A;');
css = css.replace(/--primary-dark: #[0-9A-Fa-f]+;/g, '--primary-dark: #202020;');
css = css.replace(/--primary-light: #[0-9A-Fa-f]+;/g, '--primary-light: #888888;');
css = css.replace(/--accent: #[0-9A-Fa-f]+;/g, '--accent: #666666;');
css = css.replace(/--accent-light: #[0-9A-Fa-f]+;/g, '--accent-light: #F0F0F0;');
css = css.replace(/--bg: #[0-9A-Fa-f]+;/g, '--bg: #F8F9FA;');
css = css.replace(/--border: #[0-9A-Fa-f]+;/g, '--border: #E5E7EB;');
css = css.replace(/--text: #[0-9A-Fa-f]+;/g, '--text: #333333;');
css = css.replace(/--text-muted: #[0-9A-Fa-f]+;/g, '--text-muted: #777777;');

// Hero gradient
css = css.replace(/#7B2D8C/g, '#3A3A3A');

// Hero pink badge to gray
css = css.replace(/rgba\(190,45,90,0\.3\)/g, 'rgba(0,0,0,0.1)');
css = css.replace(/rgba\(190,45,90,0\.4\)/g, 'rgba(0,0,0,0.15)');
css = css.replace(/color: #F0B0C8/g, 'color: #DDDDDD');

// Hero stats text #F4AFCA
css = css.replace(/color: #F4AFCA/g, 'color: #FFFFFF');

// Background blob
css = css.replace(/rgba\(190,45,90,0\.12\)/g, 'rgba(0,0,0,0.05)');

// Q Card answered border #C5A8EC
css = css.replace(/#C5A8EC/g, '#B0B0B0');

// Option item hover/selected
css = css.replace(/#FDFCFF/g, '#FFFFFF');
css = css.replace(/#F7F2FF/g, '#F2F2F2');
css = css.replace(/rgba\(61,21,102/g, 'rgba(0,0,0');
css = css.replace(/linear-gradient\(135deg, #F5EEFF, #EDE0FF\)/g, 'linear-gradient(135deg, #F9F9F9, #EBEBEB)');

// Submit Button gradients
css = css.replace(/linear-gradient\(135deg, var\(--accent\), #D94070\)/g, 'linear-gradient(135deg, var(--accent), #444)');
css = css.replace(/rgba\(190,45,90/g, 'rgba(0,0,0');

// TAMS badges and tags
css = css.replace(/#5B2A9C/g, '#555555');
css = css.replace(/#EEE4FF/g, '#EFEFEF');
css = css.replace(/#4A1A7C/g, '#444444');
css = css.replace(/#F2E8FF/g, '#F5F5F5');

fs.writeFileSync('fit-check_copy.html', css, 'utf-8');
console.log('Done mapping to gray');
