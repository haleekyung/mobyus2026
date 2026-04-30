from PIL import Image, ImageChops
import os

def autocrop_image(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    # Check if there is transparency
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    
    # If the image doesn't have a transparent bounding box (i.e. it's fully opaque)
    if bbox == img.getbbox():
        # Let's find bounding box of non-white pixels
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        diff = ImageChops.difference(img, bg)
        diff = ImageChops.add(diff, diff, 2.0, -100)
        bbox = diff.getbbox()
        
    if bbox:
        cropped_img = img.crop(bbox)
        cropped_img.save(output_path)
        print(f"Cropped image saved to {output_path}. Bounding box: {bbox}")
    else:
        print("Could not find a bounding box. Image might be completely blank or solid white.")

if __name__ == "__main__":
    input_img = r"images\3layers\02_Full_Image\Full_Composition_3840x6827.png"
    output_img = r"images\img_3layers_cropped.png"
    autocrop_image(input_img, output_img)
