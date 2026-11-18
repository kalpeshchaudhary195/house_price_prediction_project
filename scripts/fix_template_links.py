import os
import re

template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
for fname in os.listdir(template_dir):
    if fname.endswith(".html"):
        fpath = os.path.join(template_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        updated = re.sub(r'src=["\']\.\./js/validation\.js["\']', 'src="/static/js/validation.js"', content)
        updated = re.sub(r'src=["\']js/validation\.js["\']', 'src="/static/js/validation.js"', updated)
        updated = re.sub(r'href=["\']properties\.html["\']', 'href="/properties"', updated)
        if updated != content:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Updated links in {fname}")
print("Completed fixing template links.")

