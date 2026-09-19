#!/usr/bin/env python3
"""
CodeAware AI - ML Vulnerability Model Training Script

Usage:
    uv run train.py
    python train.py --samples 5000 --features 30000 --c 2.0
"""

import argparse
import os
import sys
from pathlib import Path

# Ensure backend is in python path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ml.datasets.cvefixes_loader import CVEFixesLoader
from app.ml.inference.vulnerability_detector import VulnerabilityDetector
from app.ml.training.vulnerability_trainer import VulnerabilityModelTrainer


def parse_args():
    parser = argparse.ArgumentParser(
        description="Train the CodeAware AI Code Vulnerability & Safety Classifier using CVEFixes & CodeSearchNet."
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=2000,
        help="Maximum balanced dataset samples to load (default: 2000 for fast high-accuracy training, use 10000+ for full training).",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Proportion of dataset to reserve for test split (default: 0.2).",
    )
    parser.add_argument(
        "--features",
        type=int,
        default=25000,
        help="Maximum vocabulary features for TF-IDF vectorizer (default: 25000).",
    )
    parser.add_argument(
        "--c",
        type=float,
        default=2.0,
        help="Regularization strength C for Logistic Regression (default: 2.0).",
    )
    parser.add_argument(
        "--languages",
        nargs="*",
        default=None,
        help="Optional language filters (e.g. --languages c php python js). Default: all.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Custom output directory for saved model artifacts.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    print("=" * 70)
    print("🚀 CodeAware AI — ML Vulnerability Model Trainer")
    print("=" * 70)

    loader = CVEFixesLoader()
    if not loader.exists():
        print(f"❌ Error: CVEFixes dataset not found at: {loader.csv_path}")
        print("Please ensure dataset/cvefixes/CVEFixes.csv is present.")
        sys.exit(1)

    print(f"📁 Dataset Path:       {loader.csv_path}")
    print(f"⚙️  Requested Samples:  {args.samples}")
    print(f"⚙️  TF-IDF Max Features:{args.features}")
    print(f"⚙️  Test Split:         {int(args.test_size * 100)}%")
    print(f"⚙️  Languages:          {args.languages or 'All 48 Languages'}")
    print("-" * 70)
    print("⏳ Loading dataset, extracting features, and training model...")

    trainer = VulnerabilityModelTrainer(
        output_dir=Path(args.output_dir) if args.output_dir else None
    )

    try:
        meta = trainer.train(
            max_samples=args.samples,
            test_size=args.test_size,
            max_features=args.features,
            regularization_c=args.c,
            languages=args.languages,
            use_hybrid_clean=True,
        )
    except Exception as exc:
        print(f"\n❌ Training failed: {exc}")
        sys.exit(1)

    metrics = meta.get("metrics", {})
    cm = metrics.get("confusion_matrix", {})

    print("\n" + "=" * 70)
    print("✅ Training Completed Successfully!")
    print("=" * 70)
    print(f"• Model ID:          {meta.get('model_id')}")
    print(f"• Duration:          {meta.get('training_duration_seconds')}s")
    print(f"• Accuracy:          {metrics.get('accuracy', 0.0) * 100:.2f}%")
    print(f"• Precision:         {metrics.get('precision', 0.0) * 100:.2f}%")
    print(f"• Recall:            {metrics.get('recall', 0.0) * 100:.2f}%")
    print(f"• F1 Score:          {metrics.get('f1_score', 0.0):.4f}")
    print(
        f"• Confusion Matrix:  TN={cm.get('true_negatives')}, FP={cm.get('false_positives')}, "
        f"FN={cm.get('false_negatives')}, TP={cm.get('true_positives')}"
    )
    print(f"• Artifacts Saved:   {trainer.output_dir}")

    # Verify live detector hot reload
    print("\n🔍 Verifying detector with live inference test...")
    detector = VulnerabilityDetector()
    detector.load_model()

    test_sample = 'void vulnerable(char *u) { char b[64]; strcpy(b, u); system(b); }'
    pred = detector.predict(test_sample)
    print(f"• Sample Code:       {test_sample}")
    print(f"• Predicted Label:   {pred['label']}")
    print(f"• Confidence Score:  {pred['vulnerability_score'] * 100:.1f}%")
    print(f"• Risk Level:        {pred['risk_level']}")
    print("=" * 70)


if __name__ == "__main__":
    main()
