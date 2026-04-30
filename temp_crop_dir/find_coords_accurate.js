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

    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png') && !f.includes('minus') && !f.includes('People'));
    const results = {};

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const asset = await Jimp.read(path.join(assetsDir, file));
        
        let bestX = 0, bestY = 0;
        let minDiff = Infinity;
        
        // Scan with a stride of 4 to be fast but accurate
        const STRIDE = 4;
        
        // Pick a reliable feature point that is definitely inside the object
        let cx = Math.floor(asset.bitmap.width / 2);
        let cy = Math.floor(asset.bitmap.height / 2);
        
        for (let by = 0; by < bgH - asset.bitmap.height; by += STRIDE) {
            for (let bx = 0; bx < bgW - asset.bitmap.width; bx += STRIDE) {
                
                // Quick check center pixel
                const aC = (cy * asset.bitmap.width + cx) * 4;
                if (asset.bitmap.data[aC+3] > 200) {
                    const bC = ((by + cy) * bgW + (bx + cx)) * 4;
                    if (Math.abs(bg.bitmap.data[bC] - asset.bitmap.data[aC]) > 30) continue;
                }

                let diff = 0;
                let pixelsChecked = 0;
                
                // Compare a small grid of pixels
                for (let ay = 0; ay < asset.bitmap.height; ay+=10) {
                    for (let ax = 0; ax < asset.bitmap.width; ax+=10) {
                        const aIdx = (ay * asset.bitmap.width + ax) * 4;
                        if (asset.bitmap.data[aIdx + 3] > 200) {
                            pixelsChecked++;
                            const bIdx = ((by + ay) * bgW + (bx + ax)) * 4;
                            diff += Math.abs(bg.bitmap.data[bIdx] - asset.bitmap.data[aIdx]);
                            diff += Math.abs(bg.bitmap.data[bIdx+1] - asset.bitmap.data[aIdx+1]);
                            diff += Math.abs(bg.bitmap.data[bIdx+2] - asset.bitmap.data[aIdx+2]);
                        }
                    }
                    if (pixelsChecked > 0 && (diff/pixelsChecked) > 30) break; // early exit
                }
                
                if (pixelsChecked > 0) {
                    diff = diff / pixelsChecked;
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestX = bx;
                        bestY = by;
                    }
                }
            }
        }
        
        // Fine tune around bestX, bestY
        let fineBestX = bestX, fineBestY = bestY;
        let fineMinDiff = minDiff;
        
        for (let by = Math.max(0, bestX-STRIDE); by <= Math.min(bgH, bestY+STRIDE); by++) {
            for (let bx = Math.max(0, bestX-STRIDE); bx <= Math.min(bgW, bestX+STRIDE); bx++) {
                let diff = 0;
                let pixelsChecked = 0;
                for (let ay = 0; ay < asset.bitmap.height; ay+=4) {
                    for (let ax = 0; ax < asset.bitmap.width; ax+=4) {
                        const aIdx = (ay * asset.bitmap.width + ax) * 4;
                        if (asset.bitmap.data[aIdx + 3] > 200) {
                            pixelsChecked++;
                            const bIdx = ((by + ay) * bgW + (bx + ax)) * 4;
                            diff += Math.abs(bg.bitmap.data[bIdx] - asset.bitmap.data[aIdx]);
                            diff += Math.abs(bg.bitmap.data[bIdx+1] - asset.bitmap.data[aIdx+1]);
                            diff += Math.abs(bg.bitmap.data[bIdx+2] - asset.bitmap.data[aIdx+2]);
                        }
                    }
                }
                if (pixelsChecked > 0) {
                    diff = diff / pixelsChecked;
                    if (diff < fineMinDiff) {
                        fineMinDiff = diff;
                        fineBestX = bx;
                        fineBestY = by;
                    }
                }
            }
        }

        results[file] = { x: fineBestX, y: fineBestY, w: asset.bitmap.width, h: asset.bitmap.height };
        console.log(`Found ${file} at x:${fineBestX}, y:${fineBestY} diff:${fineMinDiff}`);
    }

    fs.writeFileSync('coords.json', JSON.stringify(results, null, 2));
    console.log('Finished. Saved to coords.json');
}

findCoordinates().catch(console.error);
