const fs = require('fs');
const Jimp = require('jimp');

async function processTightCrop() {
    console.log('Loading image...');
    const image = await Jimp.read('../images/img_3layers_cropped.png');
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Find tight bounds
    let top = height, bottom = 0, left = width, right = 0;
    
    image.scan(0, 0, width, height, function(x, y, idx) {
        const alpha = this.bitmap.data[idx + 3];
        if (alpha > 0) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            if (x < left) left = x;
            if (x > right) right = x;
        }
    });

    console.log(`Tight bounds: left=${left}, right=${right}, top=${top}, bottom=${bottom}`);
    
    const newWidth = right - left + 1;
    const newHeight = bottom - top + 1;
    
    console.log(`Cropping to: ${newWidth}x${newHeight}`);
    
    // Crop image
    image.crop(left, top, newWidth, newHeight);
    await image.writeAsync('../images/img_3layers_cropped_tight.png');
    console.log('Saved img_3layers_cropped_tight.png');
    
    // Now update HTML
    let html = fs.readFileSync('../index_test.html', 'utf8');
    
    const regex = /<div class="interactive-architecture"([\s\S]*?)<\/div>/;
    const match = html.match(regex);
    if (match) {
        let block = match[0];
        
        // Update image src
        block = block.replace('img_3layers_cropped.png', 'img_3layers_cropped_tight.png');
        
        // Update all left and top and width percentages
        // Format: left: 65.4088%; top: 75.5894%; width: 7.937%;
        block = block.replace(/left:\s*([0-9.]+)%;\s*top:\s*([0-9.]+)%;\s*width:\s*([0-9.]+)%;/g, (m, pctLeft, pctTop, pctWidth) => {
            const oldAbsX = parseFloat(pctLeft) * width / 100;
            const oldAbsY = parseFloat(pctTop) * height / 100;
            const oldAbsW = parseFloat(pctWidth) * width / 100;
            
            const newAbsX = oldAbsX - left;
            const newAbsY = oldAbsY - top;
            
            const newPctLeft = (newAbsX / newWidth * 100).toFixed(4);
            const newPctTop = (newAbsY / newHeight * 100).toFixed(4);
            const newPctWidth = (oldAbsW / newWidth * 100).toFixed(4);
            
            return `left: ${newPctLeft}%; top: ${newPctTop}%; width: ${newPctWidth}%;`;
        });
        
        html = html.replace(regex, block);
        fs.writeFileSync('../index_test.html', html);
        console.log('HTML updated with new coordinates!');
    }
}

processTightCrop().catch(console.error);
