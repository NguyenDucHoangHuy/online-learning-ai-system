import argparse
from pathlib import Path

import pandas as pd


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def main():
    parser = argparse.ArgumentParser(description="Inspect dataset files and likely labels.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "raw",
    )
    args = parser.parse_args()

    if not args.data_dir.exists():
        raise SystemExit(f"Dataset folder not found: {args.data_dir}")

    files = [path for path in args.data_dir.rglob("*") if path.is_file()]
    csv_files = [path for path in files if path.suffix.lower() == ".csv"]
    image_files = [path for path in files if path.suffix.lower() in IMAGE_EXTENSIONS]

    print(f"Dataset folder: {args.data_dir}")
    print(f"Total files: {len(files)}")
    print(f"CSV files: {len(csv_files)}")
    print(f"Image files: {len(image_files)}")

    for csv_path in csv_files[:10]:
        frame = pd.read_csv(csv_path)
        print(f"\nCSV: {csv_path.relative_to(args.data_dir)}")
        print(f"Shape: {frame.shape[0]} rows x {frame.shape[1]} columns")
        print("Columns:")
        for column in frame.columns:
            print(f"  - {column}")
        print("Preview:")
        print(frame.head(3).to_string(index=False))

    if image_files:
        print("\nLikely image classes by parent folder:")
        counts = {}
        for image_path in image_files:
            label = image_path.parent.name
            counts[label] = counts.get(label, 0) + 1
        for label, count in sorted(counts.items(), key=lambda item: item[0].lower()):
            print(f"  - {label}: {count}")


if __name__ == "__main__":
    main()
