import sys
import os

file_path = r"c:\Users\MONVC-A3-175\OneDrive - 모비어스앤밸류체인\바탕 화면\홈페이지 리뉴얼\개발\260326_웹사이트\styles\main.css"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Snippet 1: GNB Container in mobile media query
target1 = "/* GNB & Mobile Menu */\n    .gnb-container {\n        padding: 0 40px;\n    }"
if target1 not in content:
    target1 = target1.replace("    ", "\t")

replacement1 = "/* GNB & Mobile Menu */\n    .gnb-container {\n        padding: 0 15px;\n    }\n    .gnb-left img {\n        height: 24px !important;\n    }"
if "\t" in target1: replacement1 = replacement1.replace("    ", "\t")

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced GNB container")

# Snippet 2: Mobile Menu Button
target2 = ".mobile-menu-btn {\n        display: block !important; /* Force show hamburger */\n        z-index: 9999 !important;\n    }"
if target2 not in content:
    target2 = target2.replace("    ", "\t")

replacement2 = ".mobile-menu-btn {\n        display: block !important;\n        z-index: 10001 !important;\n        margin-left: 8px;\n    }\n    .mobile-menu-btn span {\n        background-color: #111 !important;\n    }"
if "\t" in target2: replacement2 = replacement2.replace("    ", "\t")

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced Mobile Menu Button")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
