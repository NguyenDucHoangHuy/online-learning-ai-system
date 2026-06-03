import argparse
import shutil
import subprocess
from pathlib import Path
from zipfile import ZipFile


DEFAULT_DATASET = "thinhltn/dataset-engagement"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parents[1] / "data"


def main():
    parser = argparse.ArgumentParser(description="Download the Kaggle engagement dataset.")
    parser.add_argument("--dataset", default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    raw_dir = args.output_dir / "raw"
    zip_path = args.output_dir / "dataset-engagement.zip"
    raw_dir.mkdir(parents=True, exist_ok=True)

    kaggle_exe = shutil.which("kaggle")
    if not kaggle_exe:
        raise SystemExit(
            "Kaggle CLI executable was not found. Run: python -m pip install -r requirements.txt"
        )

    subprocess.run(
        [
            kaggle_exe,
            "datasets",
            "download",
            "-d",
            args.dataset,
            "-p",
            str(args.output_dir),
        ],
        check=True,
    )

    candidates = sorted(args.output_dir.glob("*.zip"), key=lambda path: path.stat().st_mtime)
    if not candidates:
        raise SystemExit("No dataset zip was downloaded. Check Kaggle credentials/access.")

    downloaded_zip = candidates[-1]
    if downloaded_zip != zip_path:
        downloaded_zip.replace(zip_path)

    with ZipFile(zip_path) as archive:
        archive.extractall(raw_dir)

    print(f"Dataset extracted to: {raw_dir}")


if __name__ == "__main__":
    main()
