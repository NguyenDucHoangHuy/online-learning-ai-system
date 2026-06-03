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
DEFAULT_IMAGE_SIZE = (48, 48)


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
        "fear": "fear",
        "fearful": "fear",
        "disgust": "disgust",
        "disgusted": "disgust",
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


def find_split_samples(data_dir, split_name):
    split_dir = data_dir / split_name
    return find_samples(split_dir) if split_dir.exists() else []


def extract_emotion_features(image, image_size=DEFAULT_IMAGE_SIZE):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, image_size, interpolation=cv2.INTER_AREA)
    equalized = cv2.equalizeHist(resized)
    pixels = (equalized.astype("float32") / 255.0).reshape(-1)
    stats = np.array(
        [
            float(np.mean(equalized)) / 255.0,
            float(np.std(equalized)) / 255.0,
        ],
        dtype="float32",
    )
    return np.concatenate([pixels, stats])


def read_face_features(image_path):
    image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return None
    image_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    return extract_emotion_features(image_bgr)


def build_feature_matrix(samples):
    features = []
    labels = []
    skipped = 0
    for image_path, label in samples:
        row = read_face_features(image_path)
        if row is None:
            skipped += 1
            continue
        features.append(row)
        labels.append(label)
    return np.asarray(features, dtype="float32"), np.asarray(labels), skipped


def main():
    parser = argparse.ArgumentParser(description="Train emotion classifier from folder labels.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    args = parser.parse_args()

    train_samples = find_split_samples(args.data_dir, "train")
    test_samples = find_split_samples(args.data_dir, "test")
    samples = train_samples + test_samples if train_samples and test_samples else find_samples(args.data_dir)
    print(f"Samples found: {len(samples)}")
    if not samples:
        raise SystemExit(f"No emotion images found in: {args.data_dir}")

    x, y, skipped = build_feature_matrix(samples)
    print(f"Usable samples: {len(x)}")
    print(f"Skipped samples: {skipped}")
    print("Class distribution:")
    unique, counts = np.unique(y, return_counts=True)
    for label, count in zip(unique, counts):
        print(f"{label}: {count}")

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
                SGDClassifier(
                    loss="log_loss",
                    alpha=0.0002,
                    max_iter=900,
                    tol=1e-3,
                    early_stopping=True,
                    validation_fraction=0.1,
                    n_iter_no_change=6,
                    random_state=42,
                    class_weight="balanced",
                    n_jobs=-1,
                ),
            ),
        ]
    )

    if train_samples and test_samples:
        x_train, y_train, train_skipped = build_feature_matrix(train_samples)
        x_test, y_test, test_skipped = build_feature_matrix(test_samples)
        print(f"Official split: train={len(x_train)} test={len(x_test)}")
        print(f"Official split skipped: train={train_skipped} test={test_skipped}")
    else:
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y,
        )

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    print("\nEvaluation:")
    print(classification_report(y_test, predictions, zero_division=0))

    # Refit on every available sample before saving so production uses all data.
    model.fit(x, y)

    args.model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "classes": sorted(unique.tolist()),
        "input_size": list(DEFAULT_IMAGE_SIZE),
        "feature_kind": "pixels_eq_v2",
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
