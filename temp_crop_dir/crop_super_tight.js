const fs = require('fs');
const Jimp = require('jimp');

async function processSuperTightCrop() {
    console.log('Loading image...');
    const image = await Jimp.read('../images/img_3layers_cropped_tight.png');
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    let top = height, bottom = 0, left = width, right = 0;
    
    image.scan(0, 0, width, height, function(x, y, idx) {
        const alpha = this.bitmap.data[idx + 3];
        // Ignore invisible stray pixels (alpha < 10)
        if (alpha > 10) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            if (x < left) left = x;
            if (x > right) right = x;
        }
    });

    console.log(`Super Tight bounds: left=${left}, right=${right}, top=${top}, bottom=${bottom}`);
    
    // Add a tiny 10px padding just to be safe
    const pad = 10;
    const cLeft = Math.max(0, left - pad);
    const cRight = Math.min(width - 1, right + pad);
    const cTop = Math.max(0, top - pad);
    const cBottom = Math.min(height - 1, bottom + pad);
    
    const newWidth = cRight - cLeft + 1;
    const newHeight = cBottom - cTop + 1;
    
    console.log(`Cropping to: x=${cLeft}, y=${cTop}, ${newWidth}x${newHeight}`);
    
    image.crop(cLeft, cTop, newWidth, newHeight);
    await image.writeAsync('../images/img_3layers_super_tight.png');
    console.log('Saved img_3layers_super_tight.png');
    
    let html = fs.readFileSync('../index_test.html', 'utf8');
    
    const regex = /<div class="interactive-architecture"([\s\S]*?)<\/div>/;
    const match = html.match(regex);
    if (match) {
        let block = match[0];
        block = block.replace('img_3layers_cropped_tight.png', 'img_3layers_super_tight.png');
        
        block = block.replace(/left:\s*([0-9.]+)%;\s*top:\s*([0-9.]+)%;\s*width:\s*([0-9.]+)%;/g, (m, pctLeft, pctTop, pctWidth) => {
            const oldAbsX = parseFloat(pctLeft) * width / 100;
            const oldAbsY = parseFloat(pctTop) * height / 100;
            const oldAbsW = parseFloat(pctWidth) * width / 100;
            
            const newAbsX = oldAbsX - cLeft;
            const newAbsY = oldAbsY - cTop;
            
            const newPctLeft = (newAbsX / newWidth * 100).toFixed(4);
            const newPctTop = (newAbsY / newHeight * 100).toFixed(4);
            const newPctWidth = (oldAbsW / newWidth * 100).toFixed(4);
            
            return `left: ${newPctLeft}%; top: ${newPctTop}%; width: ${newPctWidth}%;`;
        });
        
        html = html.replace(regex, block);
        fs.writeFileSync('../index_test.html', html);
        console.log('HTML updated with super tight coordinates!');
    }
}

processSuperTightCrop().catch(console.error);
