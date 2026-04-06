import re

# Read both files
with open('mobyus-fitcheck.html', 'r', encoding='utf-8') as f:
    source = f.read()

with open('fit-check_copy.html', 'r', encoding='utf-8') as f:
    dest = f.read()

# 1. Extract styles from mobyus-fitcheck (excluding * and body, or just replace all and keep :root + specific classes)
style_content = re.search(r'<style>(.*?)</style>', source, re.DOTALL).group(1)
# Remove the * { box-sizing... } and body { ... }
style_content = re.sub(r'\* \{[^}]+\}', '', style_content)
style_content = re.sub(r'body \{[^}]+\}', '', style_content)
# We will wrap it with a .fc-page-wrapper style for safety
style_content += "\n.fc-page-wrapper { background: var(--bg); padding-bottom: 0px; }\n"
style_content += ".fc-page-wrapper .hero { padding-top: 60px; }\n"
# Remove the site-header styles
style_content = re.sub(r'/\* ── HEADER ── \*/.*?/\* ── HERO BANNER ── \*/', '/* ── HERO BANNER ── */', style_content, flags=re.DOTALL)

# Replace the style block in fit-check_copy.html
dest = re.sub(r'<style>.*?</style>', f'<style>{style_content}</style>', dest, flags=re.DOTALL)

# 2. Extract Hero, Main Wrap, and Sticky Footer
hero_content = re.search(r'<div class="hero".*?</div>\s*</div>\s*</div>', source, re.DOTALL).group(0)
main_wrap_content = re.search(r'<div class="main-wrap">.*</div><!-- /main-wrap -->', source, re.DOTALL).group(0)
sticky_footer_content = re.search(r'<div class="sticky-footer" id="sticky-footer">.*?</div>', source, re.DOTALL).group(0)

new_main = f"""<main class="fc-page-wrapper">
{hero_content}
{main_wrap_content}
{sticky_footer_content}
</main>"""

# Replace the <main> block in fit-check_copy.html
dest = re.sub(r'<main>.*?</main>', new_main, dest, flags=re.DOTALL)

# 3. Extract the Script from mobyus-fitcheck
script_content = re.search(r'<script>\s*// ── STATE ──.*?(?=</script>)', source, re.DOTALL).group(0)
# We need to drop ans-counter updates since we removed the header
script_content = script_content.replace("document.getElementById('ans-counter').textContent = done + ' / 6 답변 완료';", "")
script_content = script_content.replace("document.getElementById('ans-counter').classList.add('done');", "")
script_content = script_content.replace("document.getElementById('ans-counter').classList.remove('done');", "")

# We will replace the <script> block at the end of fit-check_copy.html (the one with // Fit Check Logic)
dest = re.sub(r'<script>\s*// Fit Check Logic.*?</script>', script_content + "\n</script>", dest, flags=re.DOTALL)

# Add class changes in script for compatibility with new layout if needed
# We don't have hero-section and sticky-footer hiding issues, but wait:
# The original script does:
# document.getElementById('hero-section').style.display = 'none';
# Which matches the ID inside hero_content: <div class="hero" id="hero-section"> (Wait, let's check if it has ID in source)
# Yes: <div class="hero" id="hero-section">

# Write back to fit-check_copy.html
with open('fit-check_copy.html', 'w', encoding='utf-8') as f:
    f.write(dest)

print("Merge completed!")
