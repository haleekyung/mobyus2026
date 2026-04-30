const fs = require('fs');
const Jimp = require('jimp');
const path = require('path');

const bgPath = '../images/3layers/02_Full_Image/Full_Composition_3840x6827.png';
const assetsDir = '../images/3layers/04_Assets_Object/';

async function findCoordinates() {
    console.log('Loading full composition...');
    const bg = await Jimp.read(bgPath);
    const bgW = bg.bitmap.width;
    const bgH = bg.bitmap.height;

    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));
    const results = {};

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const asset = await Jimp.read(path.join(assetsDir, file));
        
        // Find first non-transparent pixel in asset
        let firstPixel = null;
        for (let y = 0; y < asset.bitmap.height; y++) {
            for (let x = 0; x < asset.bitmap.width; x++) {
                const idx = (y * asset.bitmap.width + x) * 4;
                if (asset.bitmap.data[idx + 3] > 0) { // alpha > 0
                    firstPixel = { x, y, r: asset.bitmap.data[idx], g: asset.bitmap.data[idx+1], b: asset.bitmap.data[idx+2], a: asset.bitmap.data[idx+3] };
                    break;
                }
            }
            if (firstPixel) break;
        }

        if (!firstPixel) {
            console.log(`Asset ${file} is completely transparent!`);
            continue;
        }

        let found = false;
        // Scan BG for this pixel
        for (let by = 0; by < bgH - asset.bitmap.height; by++) {
            for (let bx = 0; bx < bgW - asset.bitmap.width; bx++) {
                const bgIdx = ((by + firstPixel.y) * bgW + (bx + firstPixel.x)) * 4;
                
                // Fast check of the first pixel
                if (bg.bitmap.data[bgIdx] === firstPixel.r &&
                    bg.bitmap.data[bgIdx+1] === firstPixel.g &&
                    bg.bitmap.data[bgIdx+2] === firstPixel.b &&
                    bg.bitmap.data[bgIdx+3] === firstPixel.a) {
                    
                    // Verify a few more pixels (e.g., center pixel, last pixel)
                    let match = true;
                    const testPoints = [
                        {x: Math.floor(asset.bitmap.width/2), y: Math.floor(asset.bitmap.height/2)},
                        {x: asset.bitmap.width - 1, y: asset.bitmap.height - 1}
                    ];

                    for (let pt of testPoints) {
                        const aIdx = (pt.y * asset.bitmap.width + pt.x) * 4;
                        if (asset.bitmap.data[aIdx + 3] > 0) { // only check if non-transparent in asset
                            const bIdx = ((by + pt.y) * bgW + (bx + pt.x)) * 4;
                            if (bg.bitmap.data[bIdx] !== asset.bitmap.data[aIdx] ||
                                bg.bitmap.data[bIdx+1] !== asset.bitmap.data[aIdx+1] ||
                                bg.bitmap.data[bIdx+2] !== asset.bitmap.data[aIdx+2]) {
                                match = false;
                                break;
                            }
                        }
                    }

                    if (match) {
                        // Let's do a slightly more thorough check for safety
                        let fullMatch = true;
                        for(let testY = 0; testY < asset.bitmap.height; testY += 10) {
                            for(let testX = 0; testX < asset.bitmap.width; testX += 10) {
                                const aI = (testY * asset.bitmap.width + testX) * 4;
                                if (asset.bitmap.data[aI + 3] > 0) {
                                    const bI = ((by + testY) * bgW + (bx + testX)) * 4;
                                    if (Math.abs(bg.bitmap.data[bI] - asset.bitmap.data[aI]) > 5 ||
                                        Math.abs(bg.bitmap.data[bI+1] - asset.bitmap.data[aI+1]) > 5) {
                                        fullMatch = false; break;
                                    }
                                }
                            }
                            if (!fullMatch) break;
                        }

                        if (fullMatch) {
                            results[file] = { x: bx, y: by, w: asset.bitmap.width, h: asset.bitmap.height };
                            console.log(`Found ${file} at x:${bx}, y:${by}`);
                            found = true;
                            break;
                        }
                    }
                }
            }
            if (found) break;
        }

        if (!found) {
            console.log(`Could not find ${file}`);
        }
    }

    fs.writeFileSync('coords.json', JSON.stringify(results, null, 2));
    console.log('Finished. Saved to coords.json');
}

findCoordinates().catch(console.error);
