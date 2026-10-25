#!/usr/bin/env python3
"""
Dayprint Zero-Shot Voice Cloner using VoxCPM2.
Clones a user's voice from a short reference audio clip (5-10s) and synthesizes
any target text with their exact timbre and pitch.
"""

import os
import sys
import argparse
import torch
import soundfile as sf
from voxcpm import VoxCPM

def clone_voice(
    reference_wav: str,
    target_text: str,
    output_wav: str = "audio/my_cloned_voice.wav",
    prompt_text: str = None,
    cfg_value: float = 2.5,
    inference_timesteps: int = 12
):
    if not os.path.exists(reference_wav):
        print(f"❌ Error: Reference audio file not found: {reference_wav}")
        return

    os.makedirs(os.path.dirname(os.path.abspath(output_wav)), exist_ok=True)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print("==================================================")
    print(" Dayprint Zero-Shot Voice Cloner (VoxCPM2)")
    print("==================================================")
    print(f"Compute Device: {device.upper()}")
    print(f"Reference Audio: {reference_wav}")
    if prompt_text:
        print(f"Reference Transcript: {prompt_text}")
    print(f"Target Text: {target_text[:70]}...")

    print("\nLoading VoxCPM2 model...")
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, device=device)
    sample_rate = getattr(model.tts_model, "sample_rate", 48000)

    print("Generating cloned speech...")
    torch.manual_seed(42)
    wav = model.generate(
        text=target_text,
        prompt_wav_path=reference_wav if prompt_text else None,
        prompt_text=prompt_text,
        reference_wav_path=reference_wav if not prompt_text else None,
        cfg_value=cfg_value,
        inference_timesteps=inference_timesteps
    )

    sf.write(output_wav, wav, sample_rate)
    duration = len(wav) / sample_rate
    print(f"\n✅ Voice Clone Complete! Saved to: {output_wav} ({duration:.1f}s, {sample_rate}Hz)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zero-shot Voice Cloning with VoxCPM2")
    parser.add_argument("--ref", required=True, help="Path to your voice recording (.wav, .m4a, .mp3)")
    parser.add_argument("--text", required=True, help="Text to speak in your voice")
    parser.add_argument("--out", default="audio/my_cloned_voice.wav", help="Output file path")
    parser.add_argument("--prompt-text", default=None, help="The exact words spoken in the reference recording (recommended for best accuracy)")
    args = parser.parse_args()

    clone_voice(
        reference_wav=args.ref,
        target_text=args.text,
        output_wav=args.out,
        prompt_text=args.prompt_text
    )
