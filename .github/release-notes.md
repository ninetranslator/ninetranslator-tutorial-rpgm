A five-minute RPG Maker MV game in Japanese for trying [ninetranslator](https://ninetranslator.com) on.

**To play it:** download `ninetranslator-tutorial-windows.zip`, unzip it, and follow `README.txt` inside. You open the folder in the translator, translate it, install the translation, then double-click `Game.exe`.

**What is in the zip:** GitHub Actions built it from this tag's source code. Nobody uploaded it by hand.
- `www/` is the game: the open-source RPG Maker MV core scripts (MIT) and the pictures and data from this repository.
- `Game.exe` and the files next to it are [NW.js](https://nwjs.io) v0.29.4 for Windows, unchanged. `Game.exe` is NW.js's own `nw.exe`, renamed, the same way RPG Maker MV ships its games.

**Check it yourself:**
- `gh attestation verify ninetranslator-tutorial-windows.zip -R Game-Translator-Project/ninetranslator-tutorial-rpgm` proves the zip came from this repository's build.
- You can also rebuild it (README → Build it yourself). The zip comes out byte for byte the same, so its SHA-256 matches the one below.

SHA-256:
