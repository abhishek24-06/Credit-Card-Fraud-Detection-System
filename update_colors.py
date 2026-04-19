import os
import re

from pathlib import Path

def replace_in_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for old, new in replacements:
        new_content = re.sub(old, new, new_content)

    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {path}")

def main():
    src_dir = Path("frontend/src")
    
    # Text replacements for class names
    class_replacements = [
        (r'navy-', r'slate-'),
        (r'blue-500', r'violet-500'),
        (r'blue-400', r'violet-400'),
        (r'blue-600', r'violet-600'),
        (r'blue-700', r'violet-700'),
        (r'blue-200', r'violet-200'),
        (r'bg-blue-', r'bg-violet-'),
        (r'text-blue-', r'text-violet-'),
        (r'border-blue-', r'border-violet-'),
        (r'from-blue-', r'from-violet-'),
        (r'to-blue-', r'to-violet-'),
        (r'ring-blue-', r'ring-violet-'),
    ]

    # Hex/RGBA replacements for index.css
    css_replacements = class_replacements + [
        (r'#0f172a', r'#020617'), # deeper body bg
        (r'#3b82f6', r'#8b5cf6'), # base blue to base violet
        (r'#2563eb', r'#7c3aed'), # gradient mid
        (r'#1d4ed8', r'#6d28d9'), # gradient dark
        (r'59, 130, 246', r'139, 92, 246'), # rgba blue to rgba violet
    ]

    for filepath in src_dir.rglob("*"):
        if filepath.is_file() and filepath.suffix in ['.jsx', '.css']:
            if filepath.suffix == '.css':
                replace_in_file(filepath, css_replacements)
            else:
                replace_in_file(filepath, class_replacements)

if __name__ == "__main__":
    main()
