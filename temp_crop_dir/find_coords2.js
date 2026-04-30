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
        
        let found = false;
        const TOLERANCE = 15; // Max color difference
        
        // Find a strong feature point: a pixel that is fully opaque and maybe distinct
        let featurePoints = [];
        for (let y = 0; y < asset.bitmap.height; y += 10) {
            for (let x = 0; x < asset.bitmap.width; x += 10) {
                const idx = (y * asset.bitmap.width + x) * 4;
                if (asset.bitmap.data[idx + 3] === 255) {
                    featurePoints.push({ x, y, 
                        r: asset.bitmap.data[idx], 
                        g: asset.bitmap.data[idx+1], 
                        b: asset.bitmap.data[idx+2] 
                    });
                }
            }
        }
        
        if (featurePoints.length === 0) continue;
        
        const f0 = featurePoints[0];

        // Scan BG
        for (let by = 0; by < bgH - asset.bitmap.height; by += 2) {
            for (let bx = 0; bx < bgW - asset.bitmap.width; bx += 2) {
                const bgIdx = ((by + f0.y) * bgW + (bx + f0.x)) * 4;
                
                if (Math.abs(bg.bitmap.data[bgIdx] - f0.r) < TOLERANCE &&
                    Math.abs(bg.bitmap.data[bgIdx+1] - f0.g) < TOLERANCE &&
                    Math.abs(bg.bitmap.data[bgIdx+2] - f0.b) < TOLERANCE) {
                    
                    let match = true;
                    // check other feature points
                    for (let i = 1; i < Math.min(10, featurePoints.length); i++) {
                        const pt = featurePoints[i];
                        const bIdx = ((by + pt.y) * bgW + (bx + pt.x)) * 4;
                        if (Math.abs(bg.bitmap.data[bIdx] - pt.r) > TOLERANCE ||
                            Math.abs(bg.bitmap.data[bIdx+1] - pt.g) > TOLERANCE ||
                            Math.abs(bg.bitmap.data[bIdx+2] - pt.b) > TOLERANCE) {
                            match = false;
                            break;
                        }
                    }

                    if (match) {
                        results[file] = { x: bx, y: by, w: asset.bitmap.width, h: asset.bitmap.height };
                        console.log(`Found ${file} at x:${bx}, y:${by}`);
                        found = true;
                        break;
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
