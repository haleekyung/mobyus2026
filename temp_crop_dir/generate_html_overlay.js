const fs = require('fs');

async function processData() {
    const coords = JSON.parse(fs.readFileSync('coords.json', 'utf8')); // coords from find_coords_accurate.js
    
    const cropX = 427, cropY = 607, cropW = 2986, cropH = 4165;
    
    // Generate HTML
    let html = `<div class="interactive-architecture" style="position: relative; width: 100%; max-width: 1000px; margin: 0 auto;">\n`;
    html += `    <img src="images/img_3layers_cropped.png" alt="MOBYUS 3-Layer Architecture Base" style="width: 100%; display: block;">\n`;
    
    for (const [file, data] of Object.entries(coords)) {
        if (file.includes('People') || file.includes('Gantry') || file.includes('SmartStorage')) continue; 
        
        const newX = data.x - cropX;
        const newY = data.y - cropY;
        
        // Skip if outside crop area
        if (newX < 0 || newY < 0 || newX + data.w > cropW || newY + data.h > cropH) continue;

        const pctX = ((newX / cropW) * 100).toFixed(4);
        const pctY = ((newY / cropH) * 100).toFixed(4);
        const pctW = ((data.w / cropW) * 100).toFixed(4);
        
        html += `    <a href="#" class="arch-layer-item" style="position: absolute; left: ${pctX}%; top: ${pctY}%; width: ${pctW}%; display: block;">\n`;
        html += `        <img src="images/3layers/04_Assets_Object/${file}" alt="${file.replace('.png','')}" style="width: 100%; display: block;">\n`;
        html += `    </a>\n`;
    }
    
    html += `</div>\n`;
    
    fs.writeFileSync('output_html_overlay.txt', html);
    console.log('Done!');
}

processData().catch(console.error);
