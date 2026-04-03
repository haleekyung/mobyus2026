from PIL import Image
try:
    img = Image.open(r'c:\Users\MONVC-A3-175\OneDrive - 모비어스앤밸류체인\바탕 화면\홈페이지 리뉴얼\개발\260326_웹사이트\images\tams-suite.png')
    print(f'Dimensions: {img.size[0]}x{img.size[1]}')
except Exception as e:
    print(f'Error: {e}')
