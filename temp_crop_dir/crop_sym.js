const Jimp = require('jimp');

Jimp.read('../images/3layers/02_Full_Image/Full_Composition_3840x6827.png')
  .then(image => {
    // We want to crop only the top and bottom, or crop symmetrically on left and right
    // Let's manually find the bounding box
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Scan for bounds
    let top = height, bottom = 0, left = width, right = 0;
    
    image.scan(0, 0, width, height, function(x, y, idx) {
      const alpha = this.bitmap.data[idx + 3];
      // if not completely transparent
      if (alpha > 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    });

    console.log(`Original bounding box: left=${left}, right=${right}, top=${top}, bottom=${bottom}`);

    // To keep it visually centered as it was in the original,
    // the distance from the center of the original image should be maintained.
    // Original center is width / 2.
    // We want the new image to have the same center.
    // The required half-width is the maximum of (width/2 - left) and (right - width/2).
    const cx = width / 2;
    const maxHalfWidth = Math.max(cx - left, right - cx);
    
    const newLeft = Math.max(0, Math.floor(cx - maxHalfWidth));
    const newRight = Math.min(width, Math.ceil(cx + maxHalfWidth));
    const newWidth = newRight - newLeft;
    
    const newTop = top;
    const newHeight = bottom - top + 1;

    console.log(`Symmetric crop: x=${newLeft}, y=${newTop}, w=${newWidth}, h=${newHeight}`);

    image.crop(newLeft, newTop, newWidth, newHeight);
    return image.writeAsync('../images/img_3layers_cropped.png');
  })
  .then(() => {
    console.log('Image cropped symmetrically successfully');
  })
  .catch(err => {
    console.error(err);
  });
