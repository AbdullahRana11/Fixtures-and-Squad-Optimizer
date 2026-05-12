import re
import os

target_paths = {
    "Package": "frontend/package.json",
    "Vite.config": "frontend/vite.config.ts",
    "Tsconfig": "frontend/tsconfig.json",
    "Tsconfig.node": "frontend/tsconfig.node.json",
    "Tailwind.config": "frontend/tailwind.config.js",
    "Postcss.config": "frontend/postcss.config.js",
    "Index.css": "frontend/src/index.css",
    "Index.html": "frontend/index.html",
    "Appstore": "frontend/src/store/appStore.ts",
    "Mockdata": "frontend/src/utils/mockData.ts",
    "Soundeffects": "frontend/src/utils/soundEffects.ts",
    "Themeconfig": "frontend/src/config/themeConfig.ts",
    "Entryscreen": "frontend/src/screens/EntryScreen.tsx",
    "Modeselectscreen": "frontend/src/screens/ModeSelectScreen.tsx",
    "Leaguecarousel": "frontend/src/screens/LeagueCarousel.tsx",
    "Teamselector": "frontend/src/screens/TeamSelector.tsx",
    "Fixturedisplay": "frontend/src/screens/FixtureDisplay.tsx",
    "Squadoptimizerscreen": "frontend/src/screens/SquadOptimizerScreen.tsx",
    "App": "frontend/src/App.tsx",
    "Main": "frontend/src/main.tsx",
    "Eslint.config": "frontend/eslint.config.js",
    "Readme": "frontend/README.md",
}

with open("claude_frontend_code.txt.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

current_file = None
file_contents = {}

for line in lines:
    # Match headers like "Package · JSON" or "Index · CSS" or "Index · HTML"
    match = re.match(r'^([A-Z][A-Za-z0-9\.]+)\s+[·\-\u00b7\u2022\ufffd]\s+([A-Z]+)$', line.strip())
    
    if match:
        name = match.group(1)
        ext = match.group(2)
        # handle Index HTML and CSS collisions in our simple dict
        if name == "Index" and ext == "CSS":
            name = "Index.css"
        elif name == "Index" and ext == "HTML":
            name = "Index.html"
            
        if name in target_paths:
            current_file = name
            file_contents[current_file] = []
            print(f"Found section: {name}")
            continue
    
    # If we hit a readme/markdown section at the end and it's not explicitly in our paths, we might want to stop
    # if line.startswith("File manifest") or line.startswith("Vision implementation"):
    #    current_file = None
    
    if current_file:
        file_contents[current_file].append(line)

for name, path in target_paths.items():
    if name in file_contents:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(file_contents[name])
        print(f"Written: {path}")
    else:
        print(f"Warning: {name} not found in the parsed document.")
