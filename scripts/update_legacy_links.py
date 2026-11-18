import os
import re

pages = ['about.html', 'contact.html', 'features.html', 'feedback.html', 'privacy.html', 'profile.html', 'term.html', 'terms.html']
for p in pages:
    fpath = os.path.join(os.path.dirname(__file__), '..', 'templates', p)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'href=["\']home\.html["\']', 'href="/"', content)
        content = re.sub(r'href=["\']index\.html["\']', 'href="/"', content)
        content = re.sub(r'href=["\']prediction\.html["\']', 'href="/predict"', content)
        content = re.sub(r'href=["\']about\.html["\']', 'href="/about"', content)
        content = re.sub(r'href=["\']features\.html["\']', 'href="/features"', content)
        content = re.sub(r'href=["\']feedback\.html["\']', 'href="/feedback"', content)
        content = re.sub(r'href=["\']contact\.html["\']', 'href="/contact"', content)
        content = re.sub(r'href=["\']login\.html["\']', 'href="/login"', content)
        content = re.sub(r'href=["\']signup\.html["\']', 'href="/signup"', content)
        content = re.sub(r'href=["\']terms\.html["\']', 'href="/terms"', content)
        content = re.sub(r'href=["\']privacy\.html["\']', 'href="/privacy"', content)
        content = re.sub(r'href=["\']\.\./css/style\.css["\']', 'href="/static/css/style.css"', content)
        content = re.sub(r'href=["\']\.\./style\.css["\']', 'href="/static/css/style.css"', content)
        content = re.sub(r'src=["\']\.\./js/main\.js["\']', 'src="/static/js/main.js"', content)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
print("Updated legacy links successfully.")

