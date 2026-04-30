const fs = require('fs');
const Jimp = require('jimp');
const path = require('path');

const bgPath = '../images/3layers/02_Full_Image/Full_Composition_3840x6827.png';
const assetsDir = '../images/3layers/04_Assets_Object/';
const SCALE = 0.1;

async function findCoordinates() {
    console.log('Loading full composition...');
    const bgOrig = await Jimp.read(bgPath);
    const bg = bgOrig.clone().scale(SCALE);
    const bgW = bg.bitmap.width;
    const bgH = bg.bitmap.height;

    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png') && !f.includes('minus'));
    const results = {};

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const assetOrig = await Jimp.read(path.join(assetsDir, file));
        if (assetOrig.bitmap.width < 10 || assetOrig.bitmap.height < 10) continue;
        
        const asset = assetOrig.clone().scale(SCALE);
        
        let bestX = 0, bestY = 0;
        let minDiff = Infinity;
        
        // Coarse search
        for (let by = 0; by < bgH - asset.bitmap.height; by++) {
            for (let bx = 0; bx < bgW - asset.bitmap.width; bx++) {
                let diff = 0;
                let pixelsChecked = 0;
                
                for (let ay = 0; ay < asset.bitmap.height; ay+=2) {
                    for (let ax = 0; ax < asset.bitmap.width; ax+=2) {
                        const aIdx = (ay * asset.bitmap.width + ax) * 4;
                        if (asset.bitmap.data[aIdx + 3] > 100) { // solid pixel
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
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestX = bx;
                        bestY = by;
                    }
                }
            }
        }
        
        console.log(`Coarse match for ${file} at x:${bestX}, y:${bestY} with diff ${minDiff}`);
        
        // Fine search around bestX/SCALE, bestY/SCALE
        const startX = Math.max(0, Math.floor(bestX / SCALE) - 20);
        const startY = Math.max(0, Math.floor(bestY / SCALE) - 20);
        const endX = Math.min(bgOrig.bitmap.width - assetOrig.bitmap.width, Math.floor(bestX / SCALE) + 20);
        const endY = Math.min(bgOrig.bitmap.height - assetOrig.bitmap.height, Math.floor(bestY / SCALE) + 20);
        
        let fineBestX = startX, fineBestY = startY;
        let fineMinDiff = Infinity;
        
        for (let by = startY; by < endY; by++) {
            for (let bx = startX; bx < endX; bx++) {
                let diff = 0;
                let pixelsChecked = 0;
                
                for (let ay = 0; ay < assetOrig.bitmap.height; ay+=5) {
                    for (let ax = 0; ax < assetOrig.bitmap.width; ax+=5) {
                        const aIdx = (ay * assetOrig.bitmap.width + ax) * 4;
                        if (assetOrig.bitmap.data[aIdx + 3] > 100) {
                            pixelsChecked++;
                            const bIdx = ((by + ay) * bgOrig.bitmap.width + (bx + ax)) * 4;
                            diff += Math.abs(bgOrig.bitmap.data[bIdx] - assetOrig.bitmap.data[aIdx]);
                            diff += Math.abs(bgOrig.bitmap.data[bIdx+1] - assetOrig.bitmap.data[aIdx+1]);
                            diff += Math.abs(bgOrig.bitmap.data[bIdx+2] - assetOrig.bitmap.data[aIdx+2]);
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
        
        console.log(`Fine match for ${file} at x:${fineBestX}, y:${fineBestY} with diff ${fineMinDiff}`);
        
        results[file] = { 
            x: fineBestX, 
            y: fineBestY, 
            w: assetOrig.bitmap.width, 
            h: assetOrig.bitmap.height,
            pctX: (fineBestX / bgOrig.bitmap.width * 100).toFixed(4),
            pctY: (fineBestY / bgOrig.bitmap.height * 100).toFixed(4),
            pctW: (assetOrig.bitmap.width / bgOrig.bitmap.width * 100).toFixed(4)
        };
    }

    fs.writeFileSync('coords.json', JSON.stringify(results, null, 2));
    console.log('Finished. Saved to coords.json');
}

findCoordinates().catch(console.error);
