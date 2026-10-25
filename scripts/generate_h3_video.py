#!/usr/bin/env python3
"""
MiniMax H3 (Hailuo) 15-Second Cinematic Video Generator for Dayprint Scene 1.
Generates an audiovisual cinematic intro teaser: 'The Fragmentation of You -> Birth of Digital Sub-Myself'.
Strictly NO text, typography, or UI words to prevent model hallucination.
"""

import os
import sys
import time
import json
import ssl
import urllib.request
import urllib.error

ssl._create_default_https_context = ssl._create_unverified_context

API_KEY = os.environ.get(
    "MINIMAX_API_KEY",
    "sk-api-qwmIo8NFqolVFaUxyBD0cYESAHFXUiXyWrcwMNrxEal4ZwXorsntnObKg1Y7HZAWX9Jh1FNfNB67A_wBFdzFkzYEvB7YwgAFkwpcy8qLtmB1mvpoR49twjQ"
)

PROMPT_TEXT = (
    "integrated_multimodal_description: "
    "[Shot 1] Cinematic, live-action, warm atmospheric lighting with natural film grain. "
    "A medium-wide shot frames a solitary thoughtful creator sitting before a weathered dark oak desk "
    "in an airy studio during late afternoon golden hour. "
    "Suspended in the air around them, hundreds of delicate blank parchment slips, translucent vellum membranes, "
    "and crystalline light shards float weightlessly, drifting apart and scattering into soft shadows, "
    "visually portraying fragmented memories and lost thoughts across disconnected spaces. "
    "Every paper slip is completely blank and textured, free of any text, typography, or symbols. "
    "The camera slowly pushes forward with a gentle, floating glide as golden sunbeams cut through the drifting papers. "
    "[Shot 2] At 00:05.000, the camera cuts to a close-up macro tracking shot hovering above the wooden table surface. "
    "A calm magnetic gravitational pulse begins: the scattered blank papers and warm glowing amber motes suddenly reverse direction, "
    "spiraling inward in an elegant, serene vortex toward the center of the desk. "
    "The blank slips stack and weave naturally into an orderly, textured constellation of paper layers. "
    "The camera smoothly arcs around the converging vortex as delicate torn serrated edges catch luminous rim lighting. "
    "[Shot 3] At 00:10.000, the shot transitions to a low-angle medium shot framing the creator's hands cupped gently over the gathered papers on the desk. "
    "From the unified stack, a tranquil, radiant golden-amber luminescence gently blooms, coalescing into an ethereal, "
    "translucent holographic silhouette that mirrors the creator's serene posture—symbolizing the awakening of an authentic living digital twin. "
    "The warm aura casts soft Morandi amber reflections across the creator's face and hands. "
    "The camera smoothly pulls back into a harmonious, centered composition as all glowing particles gently settle into peaceful equilibrium. "
    "No text, letters, writing, numbers, or artificial user interface overlays appear anywhere in the scene. "
    "\n\noverall_soundscape: "
    "Gentle rustle of delicate paper fluttering in still air, deep studio room tone, soft ethereal magnetic resonance hum as particles gather, "
    "and a soothing warm acoustic breath as the papers gently land on the wood. "
    "\n\nnon_diegetic_music: "
    "Minimalist atmospheric neo-classical ambient synth pads paired with an intimate solo cello phrase and warm Rhodes piano chords, "
    "building from solitary mystery into an uplifting, transcendent feeling of cognitive wholeness."
)

def submit_task():
    url = "https://api.minimax.chat/v2/video_generation"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "MiniMax-H3",
        "content": [
            {
                "type": "text",
                "text": PROMPT_TEXT
            }
        ],
        "duration": 15,
        "resolution": "768P",
        "ratio": "16:9"
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        task_id = res.get("task_id")
        if not task_id:
            raise RuntimeError(f"Failed to submit task: {res}")
        return task_id

def query_task(task_id):
    url = f"https://api.minimax.chat/v2/query/video_generation/{task_id}"
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def download_video(file_url, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    print(f"Downloading generated video from {file_url}...")
    urllib.request.urlretrieve(file_url, output_path)
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Video downloaded successfully: {output_path} ({size_mb:.2f} MB)")

def main():
    print("==================================================")
    print(" MiniMax H3 Video Generation (15s Intro Teaser)")
    print("==================================================")
    print("Submitting generation task to MiniMax H3 V2 API...")
    task_id = submit_task()
    print(f"Task successfully created! Task ID: {task_id}")
    print("Waiting for video rendering (typically 1-3 minutes)...")

    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "video", "scene1_h3_intro.mp4"))

    start_time = time.time()
    while True:
        time.sleep(10)
        elapsed = int(time.time() - start_time)
        data = query_task(task_id)
        task = data.get("task", {})
        status = task.get("status", "unknown")
        print(f"[{elapsed}s] Current status: {status.upper()}")

        if status == "success":
            file_id = task.get("file_id")
            video_url = task.get("video_url") or task.get("content", {}).get("video_url")
            print(f"\nGeneration Succeeded! Video URL: {video_url or file_id}")
            if video_url:
                download_video(video_url, output_path)
            break
        elif status in ["fail", "failed", "error"]:
            print(f"\nTask failed: {data}")
            sys.exit(1)

if __name__ == "__main__":
    main()
