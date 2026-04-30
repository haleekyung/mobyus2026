const fs = require('fs');
const Jimp = require('jimp');

async function processData() {
    const coords = JSON.parse(fs.readFileSync('coords.json', 'utf8'));
    
    // Crop the background just like we did the composite
    const bg = await Jimp.read('../images/3layers/03_Background/Background.png');
    const cropX = 427, cropY = 607, cropW = 2986, cropH = 4165;
    bg.crop(cropX, cropY, cropW, cropH);
    await bg.writeAsync('../images/img_3layers_bg_cropped.png');
    
    // Generate HTML
    let html = `<div class="interactive-architecture" style="position: relative; width: 100%; max-width: 1000px; margin: 0 auto;">\n`;
    html += `    <img src="images/img_3layers_bg_cropped.png" alt="MOBYUS 3-Layer Architecture Base" style="width: 100%; display: block;">\n`;
    
    // Some elements are not "burgundy objects" like People or Gantry. 
    // The user specifically asked for "버건디톤의 이미지들". I should probably include all assets just in case or filter them?
    // Let's include them all as interactive layers but maybe exclude people? 
    // "이 이미지 안에있는 버건디톤의 이미지들을 hover하면...". Most systems (WMS, AMR, TAMS, Lifts) are burgundy. 
    
    for (const [file, data] of Object.entries(coords)) {
        if (file.includes('People')) continue; // Exclude people, they are just grey deco
        
        const newX = data.x - cropX;
        const newY = data.y - cropY;
        
        // Skip if outside crop area
        if (newX < 0 || newY < 0 || newX + data.w > cropW || newY + data.h > cropH) continue;

        const pctX = ((newX / cropW) * 100).toFixed(4);
        const pctY = ((newY / cropH) * 100).toFixed(4);
        const pctW = ((data.w / cropW) * 100).toFixed(4);
        
        html += `    <a href="#" class="arch-layer-item" style="position: absolute; left: ${pctX}%; top: ${pctY}%; width: ${pctW}%;">\n`;
        html += `        <img src="images/3layers/04_Assets_Object/${file}" alt="${file.replace('.png','')}" style="width: 100%; display: block;">\n`;
        html += `    </a>\n`;
    }
    
    html += `</div>\n`;
    
    fs.writeFileSync('output_html.txt', html);
    console.log('Done!');
}

processData().catch(console.error);
