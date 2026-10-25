#!/usr/bin/env python3
"""
Dayprint Demo Voiceover Generator using VoxCPM2.
Generates studio-quality 48kHz WAV files for Scene 1 to Scene 5,
and combines them into dayprint_voiceover_full.wav.
"""

import os
import sys
import torch
import soundfile as sf
import numpy as np
from voxcpm import VoxCPM

SCENES = [
    {
        "id": "scene1_fragmentation",
        "title": "Scene 1: The Fragmentation of You",
        "text": (
            "Where does your authentic self actually live? "
            "Today, our lives are fractured into pieces. "
            "Our best work decisions get buried in chat threads, "
            "our study notes gather dust across random apps, "
            "and fleeting life reflections vanish into phone memos. "
            "We do not just lose notes, we lose touch with who we were. "
            "Meet Dayprint: a tactile, local-first memory sanctuary that unifies "
            "your scattered work, reading, and reflections into a single living canvas: "
            "the birth of your own Digital Sub-Myself."
        ),
    },
    {
        "id": "scene2_capture",
        "title": "Scene 2: Sub-Second Capture & Tactile Ritual",
        "text": (
            "Capturing a moment is completely frictionless. "
            "No forced folder taxonomies, no title paralysis. "
            "Just capture your thought, attach an image, and select an authentic Morandi paper stock. "
            "Press Command plus Enter, and you hear the mechanical keystroke. "
            "A realistic thermal paper slip with jagged serrated edges prints instantly onto your canvas. "
            "Recording your life suddenly transforms from an administrative chore into a delightful physical ritual."
        ),
    },
    {
        "id": "scene3_constellation",
        "title": "Scene 3: Connect & Weave - The Living Constellation",
        "text": (
            "Instead of keeping work notes in one tool and reading notes in another, "
            "Dayprint brings everything into one interconnected universe. "
            "Hover over any slip, and all related thoughts across your career and life illuminate in resonance. "
            "With bidirectional wiki-links, you can jump between connected memories with a single click. "
            "And when you open the Knowledge Constellation, Dayprint compiles your scattered reflections "
            "into an interactive neural graph of your evolving mind."
        ),
    },
    {
        "id": "scene4_evolution",
        "title": "Scene 4: Full CRUD, Evolution Logs & Cognitive Distillation",
        "text": (
            "A true digital twin must evolve. "
            "In Dayprint, every memory is living and fully editable. "
            "Rather than cluttering your canvas with duplicate notes, "
            "you can append timestamped evolution logs to watch a raw hunch mature over months. "
            "Click AI Polish to distill rough logs into quantifiable STAR achievements for your resume and reviews. "
            "Memories graduate across an autonomous five-tier cognitive pyramid, from daily moments to habits and core principles, "
            "ready to be exported as clean weekly digests with one click."
        ),
    },
    {
        "id": "scene5_sovereignty",
        "title": "Scene 5: Eternal Memory & Data Sovereignty",
        "text": (
            "Most importantly: your digital self will never be lost. "
            "Dayprint is one hundred percent local-first and silently backed up "
            "to your private GitHub repository as human-readable Markdown, "
            "zero subscription locks, complete data sovereignty. "
            "Build your memory. Cultivate your digital sub-myself. "
            "This is Dayprint. Your life, in prints. Thank you!"
        ),
    },
]

def main():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "audio"))
    os.makedirs(output_dir, exist_ok=True)

    print("==================================================")
    print(" Dayprint Demo Voiceover Generator (VoxCPM2)")
    print("==================================================")

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Target Compute Device: {device.upper()}")

    print("Loading VoxCPM2 foundation weights...")
    torch.manual_seed(42)
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, device=device)
    sample_rate = getattr(model.tts_model, "sample_rate", 48000)
    print(f"Model successfully loaded. Sampling rate: {sample_rate} Hz\n")

    full_audio_chunks = []
    # 0.6 seconds of silence pause between scenes
    silence_gap = np.zeros(int(sample_rate * 0.6), dtype=np.float32)

    for i, scene in enumerate(SCENES, 1):
        scene_id = scene["id"]
        title = scene["title"]
        text = scene["text"]

        out_path = os.path.join(output_dir, f"{scene_id}.wav")
        print(f"[{i}/{len(SCENES)}] Synthesizing {title}...")
        print(f"    Script: {text[:65]}...")

        # VoxCPM2 generation with Apple Silicon GPU acceleration
        wav = model.generate(
            text=text,
            cfg_value=2.0,
            inference_timesteps=10,
        )

        sf.write(out_path, wav, sample_rate)
        duration = len(wav) / sample_rate
        file_size_mb = os.path.getsize(out_path) / (1024 * 1024)
        print(f"    -> Saved: {out_path} ({duration:.1f}s, {file_size_mb:.2f} MB)\n")

        full_audio_chunks.append(wav)
        if i < len(SCENES):
            full_audio_chunks.append(silence_gap)

    # Export combined track
    combined_wav = np.concatenate(full_audio_chunks)
    combined_path = os.path.join(output_dir, "dayprint_voiceover_full.wav")
    sf.write(combined_path, combined_wav, sample_rate)
    total_duration = len(combined_wav) / sample_rate
    total_mb = os.path.getsize(combined_path) / (1024 * 1024)

    print("==================================================")
    print(" Voiceover Generation Complete!")
    print(f" Combined Track: {combined_path}")
    print(f" Total Duration: {total_duration:.1f} seconds (~{int(total_duration//60)}m {int(total_duration%60)}s)")
    print(f" Total Size: {total_mb:.2f} MB")
    print("==================================================")

if __name__ == "__main__":
    main()
