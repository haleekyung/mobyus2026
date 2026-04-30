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

    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png') && !f.includes('minus') && !f.includes('People') && !f.includes('Gantry') && !f.includes('SmartStorage'));
    const results = {};

    for (const file of files) {
        const asset = await Jimp.read(path.join(assetsDir, file));
        
        let exactX = -1, exactY = -1;
        
        // Find a solid center pixel
        let cx = Math.floor(asset.bitmap.width / 2);
        let cy = Math.floor(asset.bitmap.height / 2);
        const aC = (cy * asset.bitmap.width + cx) * 4;
        
        for (let by = 0; by <= bgH - asset.bitmap.height; by++) {
            for (let bx = 0; bx <= bgW - asset.bitmap.width; bx++) {
                
                const bC = ((by + cy) * bgW + (bx + cx)) * 4;
                if (bg.bitmap.data[bC] === asset.bitmap.data[aC] &&
                    bg.bitmap.data[bC+1] === asset.bitmap.data[aC+1] &&
                    bg.bitmap.data[bC+2] === asset.bitmap.data[aC+2]) {
                    
                    // Quick verification
                    let match = true;
                    // Check top-left, top-right, bottom-left, bottom-right
                    const pts = [
                        {x: 0, y: 0}, 
                        {x: asset.bitmap.width-1, y: 0},
                        {x: 0, y: asset.bitmap.height-1},
                        {x: asset.bitmap.width-1, y: asset.bitmap.height-1}
                    ];
                    
                    for (let pt of pts) {
                        const idxA = (pt.y * asset.bitmap.width + pt.x) * 4;
                        if (asset.bitmap.data[idxA+3] > 0) {
                            const idxB = ((by + pt.y) * bgW + (bx + pt.x)) * 4;
                            if (bg.bitmap.data[idxB] !== asset.bitmap.data[idxA] ||
                                bg.bitmap.data[idxB+1] !== asset.bitmap.data[idxA+1]) {
                                match = false; break;
                            }
                        }
                    }
                    
                    if (match) {
                        // Full verification
                        let fullMatch = true;
                        for (let ay = 0; ay < asset.bitmap.height; ay+=2) {
                            for (let ax = 0; ax < asset.bitmap.width; ax+=2) {
                                const idxA = (ay * asset.bitmap.width + ax) * 4;
                                if (asset.bitmap.data[idxA+3] > 200) { // check solid pixels
                                    const idxB = ((by + ay) * bgW + (bx + ax)) * 4;
                                    // Allow small difference for compression
                                    if (Math.abs(bg.bitmap.data[idxB] - asset.bitmap.data[idxA]) > 5) {
                                        fullMatch = false; break;
                                    }
                                }
                            }
                            if (!fullMatch) break;
                        }
                        
                        if (fullMatch) {
                            exactX = bx;
                            exactY = by;
                            break;
                        }
                    }
                }
            }
            if (exactX !== -1) break;
        }

        if (exactX !== -1) {
            results[file] = { x: exactX, y: exactY, w: asset.bitmap.width, h: asset.bitmap.height };
            console.log(`Found ${file} at exactly x:${exactX}, y:${exactY}`);
        } else {
            console.log(`Could not find exact match for ${file}`);
        }
    }

    fs.writeFileSync('coords_perfect.json', JSON.stringify(results, null, 2));
    console.log('Finished. Saved to coords_perfect.json');
}

findCoordinates().catch(console.error);
