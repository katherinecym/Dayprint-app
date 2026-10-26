#!/usr/bin/env python3
"""
Dayprint Demo Voiceover Generator using VoxCPM2.
Generates studio-quality 48kHz WAV files with UNIFIED VOICE TIMBRE via voice cloning reference.
Fully aligned with the calibrated second-by-second master timeline.
"""

import os
import sys
import json
import torch
import soundfile as sf
import numpy as np
from voxcpm import VoxCPM

SCENES = [
    {
        "id": "scene1_step1_sovereignty",
        "title": "Scene 1: Data Sovereignty & Step 1 - Connecting Private GitHub Repo",
        "budget_seconds": 26.0,
        "text": (
            "Where does your authentic self live? Our thoughts are scattered across silos. "
            "Because personal memories are intimate, Dayprint guarantees zero data leakage. "
            "Step one: open Settings and connect your private GitHub repository. "
            "Every memory and receipt commits directly to your repository as clean Markdown. "
            "For this walkthrough, we explore the preloaded interactive demo mode."
        ),
    },
    {
        "id": "scene2_today_canvas",
        "title": "Scene 2: Today's Canvas, Concrete Input & STAR AI Polish",
        "budget_seconds": 39.0,
        "text": (
            "Capturing is effortless. No title paralysis, no rigid folders. "
            "Write down a concrete technical challenge: "
            "documenting sync contention, replacing mutex locks with lock-free ring buffers. "
            "Click AI Polish: the STAR framework enriches raw notes into quantified wins. "
            "Weave Echo connects today's code to your past architectural foundation. "
            "Categorize flexibly, or create custom types like Architecture on the fly. "
            "Bind signature Morandi pigments, and tag your topics. "
            "Press Command Enter to print your physical slip onto canvas."
        ),
    },
    {
        "id": "scene3_companion_panel",
        "title": "Scene 3: Companion Panel — Stream, Daily Summary Slip & Activity Heatmap",
        "budget_seconds": 20.0,
        "text": (
            "The Companion Panel anchors your daily ritual in three pillars. "
            "At the top, pick your mood wash and write your evening reflection. "
            "In the center, Today's Stream flows with real-time slips and color tags. "
            "At the bottom, your Heatmap tracks consistency and cognitive streaks."
        ),
    },
    {
        "id": "scene4_life_stubs_receipt",
        "title": "Scene 4: Life Stubs & Anatomy of the Daily Thermal Receipt",
        "budget_seconds": 25.0,
        "text": (
            "Click Life Stubs to open your tactile daily diary. "
            "Notice the date masthead, mood watercolor, and dot-matrix itemized slips. "
            "Review the serif reflection, authentic wax stamp, and jagged sawtooth edge. "
            "Flip back to yesterday with one click for nostalgic review."
        ),
    },
    {
        "id": "scene5_knowledge_graph",
        "title": "Scene 5: Knowledge Graph — Force Graph, Cards Mode & Link Management",
        "budget_seconds": 34.0,
        "text": (
            "In the Knowledge Graph, reflections weave into a living constellation. "
            "Hovering over a central hub illuminates its rich relational network. "
            "Switch to Cards Mode to inspect thoughts across five cognitive tiers. "
            "Managing links is transparent. Open Link Management to prune connections, "
            "disconnecting obsolete threads with one click, "
            "or establish new causal bridges, explaining why two ideas connect."
        ),
    },
    {
        "id": "scene6_weekly_digest",
        "title": "Scene 6: Weekly Digest & Autonomous Synthesis",
        "budget_seconds": 18.0,
        "text": (
            "Open Weekly Digest: on Mondays, Dayprint reviews last week's full synthesis. "
            "Synthesizing breakthroughs across levels, extracting verified STAR achievements. "
            "Click Copy Markdown to paste your brag sheet into any review."
        ),
    },
    {
        "id": "scene7_closing",
        "title": "Scene 7: Eternal Sovereignty & Closing",
        "budget_seconds": 11.0,
        "text": (
            "Your memories stay permanently sovereign in your own private repository. "
            "Dayprint your life. All the pieces of you, coming together. Thank you!"
        ),
    },
]

def main():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "audio"))
    os.makedirs(output_dir, exist_ok=True)
    ref_voice_path = os.path.join(output_dir, "voice_ref.wav")

    print("==================================================")
    print(" Dayprint Master Demo Voiceover Generator (VoxCPM2)")
    print(" UNIFIED TIMBRE & ZERO-NOISE MODE (with Voice Reference)")
    print("==================================================")

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Target Compute Device: {device.upper()}")

    print("Loading VoxCPM2 foundation weights...")
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, device=device)
    sample_rate = getattr(model.tts_model, "sample_rate", 48000)
    print(f"Model successfully loaded. Sampling rate: {sample_rate} Hz\n")

    manifest = []
    padded_audio_chunks = []
    cumulative_offset = 0.0

    for i, scene in enumerate(SCENES, 1):
        scene_id = scene["id"]
        title = scene["title"]
        text = scene["text"]
        budget = scene["budget_seconds"]

        out_path = os.path.join(output_dir, f"{scene_id}.wav")
        print(f"[{i}/{len(SCENES)}] Synthesizing {title}...")
        print(f"    Target Budget: {budget:.1f}s | Words: {len(text.split())}")
        print(f"    Script: {text[:65]}...")

        # Maintain exact voice timbre and clean output across all scenes
        torch.manual_seed(100 + i)

        # For Scene 1, generate clean base voice if ref doesn't exist, else use ref_voice_path
        if os.path.exists(ref_voice_path):
            wav = model.generate(
                text=text,
                reference_wav_path=ref_voice_path,
                cfg_value=2.0,
                inference_timesteps=15,
            )
        else:
            wav = model.generate(
                text=text,
                cfg_value=2.0,
                inference_timesteps=15,
            )
            # Create voice reference from first 6 seconds of Scene 1
            sf.write(ref_voice_path, wav[:int(sample_rate * 6)], sample_rate)

        raw_duration = len(wav) / sample_rate
        sf.write(out_path, wav, sample_rate)
        print(f"    -> Raw Voice Audio: {raw_duration:.2f}s (Budget: {budget:.1f}s, Margin: {budget - raw_duration:+.2f}s)")

        # Pad with silence to match exact scene budget for anchor synchronization
        if raw_duration < budget:
            pad_samples = int((budget - raw_duration) * sample_rate)
            padded_wav = np.concatenate([wav, np.zeros(pad_samples, dtype=np.float32)])
        else:
            print(f"    [WARN] Scene {scene_id} exceeded budget by {raw_duration - budget:.2f}s! Using raw wav.")
            padded_wav = wav

        final_scene_dur = len(padded_wav) / sample_rate
        padded_audio_chunks.append(padded_wav)

        manifest.append({
            "scene_index": i,
            "scene_id": scene_id,
            "title": title,
            "start_time": cumulative_offset,
            "end_time": cumulative_offset + final_scene_dur,
            "raw_voice_duration": raw_duration,
            "budget_seconds": budget,
            "padded_duration": final_scene_dur,
            "audio_file": out_path,
        })

        cumulative_offset += final_scene_dur
        print(f"    -> Aligned Time Window: {manifest[-1]['start_time']:.1f}s - {manifest[-1]['end_time']:.1f}s\n")

    # Export combined master track
    combined_wav = np.concatenate(padded_audio_chunks)
    combined_path = os.path.join(output_dir, "dayprint_voiceover_full.wav")
    sf.write(combined_path, combined_wav, sample_rate)
    total_duration = len(combined_wav) / sample_rate
    total_mb = os.path.getsize(combined_path) / (1024 * 1024)

    # Save manifest JSON for the recording script
    manifest_path = os.path.join(output_dir, "audio_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "total_duration": total_duration,
            "sample_rate": sample_rate,
            "scenes": manifest
        }, f, indent=2)

    print("==================================================")
    print(" Voiceover Generation Complete!")
    print(f" Master Audio Track: {combined_path}")
    print(f" Manifest JSON:      {manifest_path}")
    print(f" Total Duration:     {total_duration:.2f} seconds ({int(total_duration//60)}m {int(total_duration%60)}s)")
    print(f" Total File Size:    {total_mb:.2f} MB")
    print("==================================================")

if __name__ == "__main__":
    main()
