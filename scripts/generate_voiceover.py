#!/usr/bin/env python3
"""
Dayprint Demo Voiceover Generator using VoxCPM2.
Generates studio-quality 48kHz WAV files for Scene 1 to Scene 7,
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
        "id": "scene1_step1_sovereignty",
        "title": "Scene 1: Data Sovereignty & Step 1 - Connecting Private GitHub Repo",
        "text": (
            "Where does your authentic self actually live? "
            "Today, our thoughts and work decisions are scattered across a dozen cloud silos. "
            "Because personal memories contain your most intimate thoughts, Dayprint is built on one core foundation: "
            "zero data leakage, complete data sovereignty. "
            "Your very first step is to open Settings and connect your private GitHub repository. "
            "Entering your repository and personal access token ensures every memory, receipt, and graph edge "
            "commits directly to your private repository as clean Markdown. "
            "For this walkthrough, we will demonstrate via our instant Demo Mode, "
            "preloaded with a systems architect's living stream."
        ),
    },
    {
        "id": "scene2_today_canvas",
        "title": "Scene 2: Today's Canvas, AI Polish, Weave Echo & Morandi Creation Ritual",
        "text": (
            "Capturing a moment is completely frictionless. "
            "No title paralysis, no rigid folder trees. "
            "Write down a raw thought, and click AI Polish: "
            "Dayprint's embedded intelligence instantly structures your rough notes into a quantifiable STAR accomplishment—"
            "Situation, Task, Action, and Result—ready for your career brag sheet. "
            "Notice the Memory Echo bar: Dayprint detects past thoughts that resonate with what you wrote. "
            "With one click on Weave Echo, you weave an authentic temporal thread connecting today's code with your past architectural foundations. "
            "Categorize with flexible types, create custom types like Architecture on the fly, bind signature Morandi paper pigments, and tag your topics. "
            "Press Command plus Enter, hear the mechanical keystroke, "
            "and your thought prints as a physical slip onto your canvas."
        ),
    },
    {
        "id": "scene3_companion_panel",
        "title": "Scene 3: Companion Panel — Stream, Daily Summary Slip & Activity Heatmap",
        "text": (
            "On the right, your Companion Panel anchors your daily ritual through three elegant pillars. "
            "At the top rests the Daily Summary Slip. "
            "Choose your daily mood watercolor wash, and write your evening reflection or takeaway—"
            "it automatically stamps onto today's permanent record. "
            "In the center, Today's Stream flows in real time, "
            "displaying every slip you captured today with precise timestamps, custom color tags, and evolution milestones. "
            "And at the bottom, your Memory Activity Heatmap tracks your consistency, "
            "visualizing your unbroken streak and cognitive contribution across the year."
        ),
    },
    {
        "id": "scene4_life_stubs_receipt",
        "title": "Scene 4: Life Stubs & Anatomy of the Daily Thermal Receipt",
        "text": (
            "Click Life Stubs, and your digital memories transform into a tactile scrapbook. "
            "Every day culminates in an authentic Daily Thermal Receipt—a physical artifact of your lived experience. "
            "Look at the meticulous anatomy: "
            "the date masthead and mood watercolor wash at the top; "
            "an itemized dot-matrix register of every slip, marked with timestamps, polaroid thumbnails, and topics; "
            "the total count of your daily moments; "
            "your personal evening reflection preserved in elegant serif typography; "
            "the authentic tilted rubber wax stamp sealing the archive; "
            "and the tactile jagged sawtooth edge at the bottom. "
            "Flip through past days with a single click: reviewing your life has never felt so nostalgic and grounding."
        ),
    },
    {
        "id": "scene5_knowledge_graph",
        "title": "Scene 5: Knowledge Graph — Force Graph, Cards Mode & Link Management",
        "text": (
            "Memories never exist in isolation. "
            "In the Knowledge Graph, Dayprint weaves your scattered reflections into a living neural constellation. "
            "In Force Graph mode, watch your thoughts cluster organically with real physics. "
            "Hover over any node, and its relational network illuminates across time. "
            "Switch seamlessly to Cards Mode to inspect your thoughts categorized across a five-tier cognitive hierarchy—"
            "from fleeting moments to habits, mental models, and core principles. "
            "And managing links is completely transparent. "
            "Open Link Management to prune outdated connections with one click, "
            "or establish new causal bridges, articulating why two ideas connect. "
            "Your knowledge network is an active, self-organizing mind."
        ),
    },
    {
        "id": "scene6_weekly_digest",
        "title": "Scene 6: Weekly Digest & Autonomous Synthesis",
        "text": (
            "Every Sunday, open the Weekly Digest. "
            "Dayprint autonomously synthesizes your entire week: "
            "clustering your key breakthroughs, charting your cognitive growth, and extracting verified STAR accomplishments. "
            "Click Copy Markdown to paste your weekly brag sheet straight into your team review or personal vault. "
            "You will never have to wonder what you accomplished this week ever again."
        ),
    },
    {
        "id": "scene7_closing",
        "title": "Scene 7: Eternal Sovereignty & Closing",
        "text": (
            "Your memories are safe, portable, and permanently yours. "
            "Stop scattering your life across walled gardens. "
            "Dayprint your life. All the pieces of you, coming together. Thank you!"
        ),
    },
]

def main():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "audio"))
    os.makedirs(output_dir, exist_ok=True)

    print("==================================================")
    print(" Dayprint Master Demo Voiceover Generator (VoxCPM2)")
    print("==================================================")

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Target Compute Device: {device.upper()}")

    print("Loading VoxCPM2 foundation weights...")
    torch.manual_seed(42)
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, device=device)
    sample_rate = getattr(model.tts_model, "sample_rate", 48000)
    print(f"Model successfully loaded. Sampling rate: {sample_rate} Hz\n")

    full_audio_chunks = []
    # 0.55 seconds of silence pause between scenes
    silence_gap = np.zeros(int(sample_rate * 0.55), dtype=np.float32)

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
