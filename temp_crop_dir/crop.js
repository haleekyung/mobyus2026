const Jimp = require('jimp');

Jimp.read('../images/3layers/02_Full_Image/Full_Composition_3840x6827.png')
  .then(image => {
    image.autocrop();
    return image.writeAsync('../images/img_3layers_cropped.png');
  })
  .then(() => {
    console.log('Image cropped successfully');
  })
  .catch(err => {
    console.error(err);
  });
