import os
import re

base_path = r'c:\Users\kyle\projects\teia\teia-ui\src'

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Replace @import '@styles/variables.scss' with @use '@styles/config' as *
    content = content.replace("@import '@styles/variables.scss';", "@use '@styles/config' as *;")
    content = content.replace('@import "@styles/variables.scss";', '@use "@styles/config" as *;')
    
    # Replace @import '@styles/layout.scss' with @use '@styles/layout' as layout
    # and update usages if any (though usually it's used as layout.respond-to already or just imported)
    content = content.replace("@import '@styles/layout.scss';", "@use '@styles/layout' as layout;")
    content = content.replace('@import "@styles/layout.scss";', '@use "@styles/layout" as layout;')
    
    # Generic @import to @use replacement for internal styles if applicable
    # (But let's be careful with aliases)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Migrated: {filepath}")

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.scss'):
            migrate_file(os.path.join(root, file))
