# by Capitanul burcea,alex
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parents[2] / "music_fallback" / "vps_music_bot.py"), run_name="__main__")
