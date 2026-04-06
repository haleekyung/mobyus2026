const fs = require('fs');
let content = fs.readFileSync('fit-check_copy.html', 'utf-8');
const lines = content.split(/\r?\n/);
const filtered = lines.filter(line => 
    !line.includes('customModal') && 
    !line.includes('modal-icon') && 
    !line.includes('modal-title') && 
    !line.includes('modal-message') && 
    !line.includes('modal-btn') && 
    !line.includes('Custom Validation Modal')
);
fs.writeFileSync('fit-check_copy.html', filtered.join('\n'), 'utf-8');
console.log('Modal removed');
