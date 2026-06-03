import argparse
import json
from pathlib import Path

import cv2
import joblib
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "emotion_raw"
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "emotion_model.joblib"


def normalize_label(label):
    text = str(label).strip().lower().replace("-", "_").replace(" ", "_")
    mapping = {
        "neutral": "neutral",
        "normal": "neutral",
        "happy": "happy",
        "sad": "sad",
        "angry": "angry",
        "surprise": "surprise",
        "surprised": "surprise",
        "fear": "sad",
        "fearful": "sad",
        "disgust": "angry",
        "disgusted": "angry",
    }
    return mapping.get(text)


def find_samples(data_dir):
    samples = []
    for image_path in data_dir.rglob("*"):
        if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        label = normalize_label(image_path.parent.name)
        if label:
            samples.append((image_path, label))
    return samples


def read_face_pixels(image_path):
    image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return None
    image = cv2.resize(image, (48, 48), interpolation=cv2.INTER_AREA)
    return (image.astype("float32") / 255.0).reshape(-1)


def main():
    parser = argparse.ArgumentParser(description="Train emotion classifier from folder labels.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    args = parser.parse_args()

    samples = find_samples(args.data_dir)
    print(f"Samples found: {len(samples)}")
    if not samples:
        raise SystemExit(f"No emotion images found in: {args.data_dir}")

    features = []
    labels = []
    skipped = 0
    for image_path, label in samples:
        pixels = read_face_pixels(image_path)
        if pixels is None:
            skipped += 1
            continue
        features.append(pixels)
        labels.append(label)

    x = np.asarray(features, dtype="float32")
    y = np.asarray(labels)
    print(f"Usable samples: {len(x)}")
    print(f"Skipped samples: {skipped}")
    print("Class distribution:")
    unique, counts = np.unique(y, return_counts=True)
    for label, count in zip(unique, counts):
        print(f"{label}: {count}")

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
                SGDClassifier(
                    loss="log_loss",
                    alpha=0.0003,
                    max_iter=1200,
                    random_state=42,
                    class_weight="balanced",
                    n_jobs=-1,
                ),
            ),
        ]
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    print("\nEvaluation:")
    print(classification_report(y_test, predictions, zero_division=0))

    args.model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "classes": sorted(unique.tolist()),
        "input_size": [48, 48],
    }
    joblib.dump(artifact, args.model_path)
    metadata_path = args.model_path.with_suffix(".json")
    metadata_path.write_text(
        json.dumps({key: value for key, value in artifact.items() if key != "model"}, indent=2),
        encoding="utf-8",
    )
    print(f"\nSaved model: {args.model_path}")
    print(f"Saved metadata: {metadata_path}")


if __name__ == "__main__":
    main()
