import os
import re

base_path = r'c:\Users\kyle\projects\teia\teia-ui\src'

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Replacements
    replacements = [
        ("@import '@styles/variables.scss';", "@use '@styles/config' as *;"),
        ('@import "@styles/variables.scss";', '@use "@styles/config" as *;'),
        ("@import '@styles/layout.scss';", "@use '@styles/layout' as layout;"),
        ('@import "@styles/layout.scss";', '@use "@styles/layout" as layout;'),
        ("@import '@styles/mixins.scss';", "@use '@styles/mixins' as *;"),
        ('@import "@styles/mixins.scss";', '@use "@styles/mixins" as *;'),
    ]
    
    for old, new in replacements:
        content = content.replace(old, new)
    
    # Move @use to top
    lines = content.splitlines()
    use_lines = [l for l in lines if l.startswith('@use ')]
    other_lines = [l for l in lines if not l.startswith('@use ')]
    
    # Preserve leading comments if any? Actually Sass is strict about @use being first.
    # We might need to keep comments that are headers.
    
    final_lines = use_lines + other_lines
    content = "\n".join(final_lines) + ("\n" if content.endswith("\n") else "")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Migrated: {filepath}")

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.scss'):
            migrate_file(os.path.join(root, file))
