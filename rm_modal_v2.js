const fs = require('fs');
let content = fs.readFileSync('fit-check_copy.html', 'utf-8');
const lines = content.split(/\r?\n/);
const filtered = lines.filter(line => 
    !line.includes('custom-modal') && 
    !line.includes('modal-icon') && 
    !line.includes('modal-title') && 
    !line.includes('modal-message') && 
    !line.includes('modal-btn') && 
    !line.includes('fas fa-exclamation-circle') &&
    !line.includes('closeModal()') &&
    !line.trim() === '</div>' && // This might be risky, but I'll check context
    !line.includes('<!-- Custom Validation Modal -->')
);

// Actually, let's just use a simpler regex for the block
let newContent = content.replace(/<!-- Custom Validation Modal -->[\s\S]*?<\/div>\s*<\/div>/, '');

fs.writeFileSync('fit-check_copy.html', newContent, 'utf-8');
console.log('Modal fully removed');
