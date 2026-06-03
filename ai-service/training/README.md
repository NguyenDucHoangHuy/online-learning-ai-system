# Engagement Model Training

This folder contains the dataset workflow for the AI service.

## 1. Install dependencies

```powershell
cd ai-service
python -m pip install -r requirements.txt
```

## 2. Add Kaggle credentials

Create an API token on Kaggle, then place it here:

```text
C:\Users\ADMIN\.kaggle\kaggle.json
```

## 3. Download and inspect the dataset

```powershell
python training/download_dataset.py
python training/inspect_dataset.py
```

## 4. Train from image folders

Use this when images are grouped like `focused/`, `distracted/`, `bored/`, etc.

```powershell
python training/train_engagement.py
```

## 5. Train from a CSV

Use this when the dataset has image paths and labels in a CSV file.

```powershell
python training/train_engagement.py --csv your_file.csv --image-column image_name --label-column engagement_level
```

The trained model is saved to:

```text
ai-service/models/engagement_model.joblib
```

When that file exists, `app.py` automatically uses it in `/analyze-student-frame`.
If it does not exist, the service keeps using the current rule-based fallback.
