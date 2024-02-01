"""
Script to use in CIs 

This will run only the tests on chromium and compare the screenshots from a given commit to
another.

It was just becoming a mess to handle it all in actions so this rough
script translates the logic
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path


def run_playwright_tests(before_commit, after_commit):
    commands = [
        f"git checkout {before_commit}",
        "sudo apt update",
        "npm ci --maxsockets 1",
        "npx playwright install chromium --with-deps",
        "npx playwright test --project chromium",
    ]

    for cmd in commands:
        subprocess.run(cmd, shell=True, check=True)

    shutil.move("./screenshot", "./screenshot-before")

    commands = [
        f"git checkout {after_commit}",
        "npm ci --maxsockets 1",
        "npx playwright install chromium --with-deps",  # yes strange but after the reinstall this is needed again
        "npx playwright test --project chromium",
    ]
    for cmd in commands:
        subprocess.run(cmd, shell=True, check=True)


def generate_side_by_side_images():
    before_dir = Path("./screenshot-before")
    after_dir = Path("./screenshot")
    output_dir = Path("./side_by_side_images")

    subprocess.run("sudo apt-get install graphicsmagick -y", shell=True, check=True)

    output_dir.mkdir(exist_ok=True)

    # themes = ["light", "dark", "kawaii", "midnight", "grass", "aqua", "coffee"]

    all_images = [f for f in Path(before_dir).iterdir() if f.suffix == ".png"]

    for image in all_images:
        before_image_path = before_dir / image.name
        after_image_path = after_dir / image.name
        output_image = output_dir / f"side_by_side_{image.name}"

        montage_cmd = f"gm montage -geometry +0+0 -tile 2x1 '{before_image_path.as_posix()}' '{after_image_path.as_posix()}' '{output_image.as_posix()}'"
        subprocess.run(montage_cmd, shell=True, check=True)


def cleanup_artifacts():
    pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python compare_screenshots.py <before_commit> [after_commit]")
        sys.exit(1)

    before_commit = sys.argv[1]
    after_commit = sys.argv[2]

    print(f"Comparing from {before_commit} to {after_commit}")

    run_playwright_tests(before_commit, after_commit)
    generate_side_by_side_images()

    # with open(os.environ["GITHUB_OUTPUT"], "a") as env_file:
    #     env_file.write(f"before_commit={before_commit}\n")
    #     env_file.write(f"after_commit={after_commit if after_commit else ''}\n")