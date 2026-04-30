const Jimp = require('jimp');

async function check() {
    const image = await Jimp.read('../images/img_3layers_cropped.png');
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    console.log(`Original width: ${w}`);
    
    for (let thresh of [0, 5, 10, 20, 50, 100, 200]) {
        let l = w, r = 0, t = h, b = 0;
        image.scan(0, 0, w, h, function(x, y, idx) {
            if (this.bitmap.data[idx+3] > thresh) {
                if (x < l) l = x;
                if (x > r) r = x;
                if (y < t) t = y;
                if (y > b) b = y;
            }
        });
        console.log(`Threshold > ${thresh}: left=${l}, right=${r}, width=${r-l+1}, top=${t}, bottom=${b}`);
    }
}

check().catch(console.error);
