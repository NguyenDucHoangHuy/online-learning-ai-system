import argparse
import json
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import cv2
import joblib
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


DEFAULT_ZIP_PATH = Path(__file__).resolve().parents[1] / "data" / "archive (4).zip"
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "eye_state_model.joblib"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
LABEL_MAP = {
    "closed": "Closed",
    "open": "Open",
    "no_yawn": "no_yawn",
    "noyawn": "no_yawn",
    "no yawn": "no_yawn",
    "yawn": "yawn",
}


def normalize_label(value):
    return LABEL_MAP.get(str(value).strip().lower())


def create_hog_descriptor(image_size):
    width, height = image_size
    return cv2.HOGDescriptor(
        _winSize=(width, height),
        _blockSize=(16, 16),
        _blockStride=(8, 8),
        _cellSize=(8, 8),
        _nbins=9,
    )


def extract_eye_state_features(image, image_size=(64, 64)):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, image_size, interpolation=cv2.INTER_AREA)
    equalized = cv2.equalizeHist(resized)
    hog = create_hog_descriptor(image_size).compute(equalized).reshape(-1)
    pixels = (equalized.astype("float32") / 255.0).reshape(-1)
    stats = np.array(
        [
            float(np.mean(equalized)) / 255.0,
            float(np.std(equalized)) / 255.0,
        ],
        dtype="float32",
    )
    return np.concatenate([hog.astype("float32"), pixels, stats])


def decode_zip_image(zip_file, name):
    data = np.frombuffer(zip_file.read(name), dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def collect_zip_samples(zip_path):
    rows = []
    with ZipFile(zip_path) as zip_file:
        for name in zip_file.namelist():
            path = Path(name)
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            parts = path.parts
            if len(parts) < 3:
                continue
            label = normalize_label(parts[1])
            if label:
                rows.append((name, label))
    return rows


def main():
    parser = argparse.ArgumentParser(
        description="Train eye/yawn auxiliary classifier from archive (4).zip.",
    )
    parser.add_argument("--zip-path", type=Path, default=DEFAULT_ZIP_PATH)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    args = parser.parse_args()

    if not args.zip_path.exists():
        raise SystemExit(f"Dataset zip not found: {args.zip_path}")

    samples = collect_zip_samples(args.zip_path)
    print(f"Samples found: {len(samples)}")
    if not samples:
        raise SystemExit("No Closed/Open/no_yawn/yawn samples found.")

    features = []
    labels = []
    skipped = 0
    with ZipFile(args.zip_path) as zip_file:
        for name, label in samples:
            image = decode_zip_image(zip_file, name)
            if image is None:
                skipped += 1
                continue
            features.append(extract_eye_state_features(image))
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
                    alpha=0.0002,
                    max_iter=1500,
                    random_state=42,
                    class_weight="balanced",
                    n_jobs=-1,
                ),
            ),
        ],
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    print("\nEvaluation:")
    print(classification_report(y_test, predictions, zero_division=0))

    args.model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "classes": sorted(unique.tolist()),
        "input_size": [64, 64],
        "feature_kind": "hog_pixels_v1",
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
