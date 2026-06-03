import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from feature_extraction import extract_engagement_features, read_image


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "engagement_model.joblib"


def normalize_attention_label(value):
    text = str(value).strip().lower().replace("-", "_").replace(" ", "_")
    high = {
        "2",
        "high",
        "engaged",
        "focused",
        "focusing",
        "very_engaged",
        "attention",
        "attentive",
    }
    medium = {"1", "medium", "normal", "neutral", "average", "moderate"}
    low = {
        "0",
        "low",
        "unfocused",
        "distracted",
        "not_engaged",
        "bored",
        "confused",
        "frustrated",
        "drowsy",
        "sleepy",
        "absent",
    }
    if text in high:
        return "HIGH"
    if text in medium:
        return "MEDIUM"
    if text in low:
        return "LOW"
    return str(value).strip().upper()


def find_image_column(frame):
    for column in frame.columns:
        name = column.lower()
        if any(token in name for token in ["image", "img", "file", "path", "filename"]):
            return column
    return None


def find_label_column(frame):
    candidates = [
        "attentionLevel",
        "attention_level",
        "engagement_level",
        "engagement",
        "label",
        "class",
        "target",
        "status",
    ]
    lower_to_original = {column.lower(): column for column in frame.columns}
    for candidate in candidates:
        if candidate.lower() in lower_to_original:
            return lower_to_original[candidate.lower()]
    return None


def collect_from_image_folders(data_dir):
    rows = []
    for image_path in data_dir.rglob("*"):
        if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        label = normalize_attention_label(image_path.parent.name)
        rows.append((image_path, label))
    return rows


def collect_from_csv(data_dir, csv_path, image_column=None, label_column=None):
    frame = pd.read_csv(csv_path)
    image_column = image_column or find_image_column(frame)
    label_column = label_column or find_label_column(frame)
    if not image_column or not label_column:
        raise SystemExit(
            "Cannot infer image/label columns. Pass --image-column and --label-column."
        )

    rows = []
    for _, row in frame.iterrows():
        image_path = Path(str(row[image_column]))
        if not image_path.is_absolute():
            image_path = data_dir / image_path
        rows.append((image_path, normalize_attention_label(row[label_column])))
    return rows


def build_feature_frame(samples):
    feature_rows = []
    labels = []
    skipped = 0
    for image_path, label in samples:
        try:
            features = extract_engagement_features(read_image(image_path))
        except Exception as error:
            print(f"Skipping {image_path}: {error}")
            skipped += 1
            continue
        if not features:
            skipped += 1
            continue
        feature_rows.append(features)
        labels.append(label)

    if not feature_rows:
        raise SystemExit("No usable face features were extracted from the dataset.")

    return pd.DataFrame(feature_rows).fillna(0), pd.Series(labels), skipped


def main():
    parser = argparse.ArgumentParser(description="Train engagement classifier from images.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--csv", type=Path)
    parser.add_argument("--image-column")
    parser.add_argument("--label-column")
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    args = parser.parse_args()

    if args.csv:
        csv_path = args.csv if args.csv.is_absolute() else args.data_dir / args.csv
        samples = collect_from_csv(args.data_dir, csv_path, args.image_column, args.label_column)
    else:
        samples = collect_from_image_folders(args.data_dir)

    print(f"Samples found: {len(samples)}")
    features, labels, skipped = build_feature_frame(samples)
    print(f"Usable samples: {len(features)}")
    print(f"Skipped samples: {skipped}")
    print("Class distribution:")
    print(labels.value_counts().to_string())

    stratify = labels if labels.value_counts().min() >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=stratify,
    )

    model = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=220,
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
        "feature_columns": list(features.columns),
        "classes": sorted(labels.unique().tolist()),
    }
    joblib.dump(artifact, args.model_path)
    metadata_path = args.model_path.with_suffix(".json")
    metadata_path.write_text(json.dumps({k: v for k, v in artifact.items() if k != "model"}, indent=2))
    print(f"\nSaved model: {args.model_path}")
    print(f"Saved metadata: {metadata_path}")


if __name__ == "__main__":
    main()
