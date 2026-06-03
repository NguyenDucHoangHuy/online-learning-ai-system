import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report


DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "raw" / "train"
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "eye_state_cnn.keras"
DEFAULT_IMAGE_SIZE = (96, 96)


def build_model(class_count):
    inputs = tf.keras.Input(shape=(*DEFAULT_IMAGE_SIZE, 3))
    x = tf.keras.layers.Rescaling(1.0 / 255.0)(inputs)
    x = tf.keras.layers.RandomFlip("horizontal")(x)
    x = tf.keras.layers.RandomRotation(0.035)(x)
    x = tf.keras.layers.RandomZoom(0.08)(x)

    for filters in [24, 48, 96]:
        x = tf.keras.layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Activation("relu")(x)
        x = tf.keras.layers.MaxPooling2D()(x)
        x = tf.keras.layers.Dropout(0.15)(x)

    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(96, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    parser = argparse.ArgumentParser(description="Train deep learning eye/yawn CNN.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--epochs", type=int, default=14)
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()

    if not args.data_dir.exists():
        raise SystemExit(f"Dataset folder not found: {args.data_dir}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        labels="inferred",
        label_mode="int",
        color_mode="rgb",
        image_size=DEFAULT_IMAGE_SIZE,
        batch_size=args.batch_size,
        validation_split=0.2,
        subset="training",
        shuffle=True,
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        labels="inferred",
        label_mode="int",
        color_mode="rgb",
        image_size=DEFAULT_IMAGE_SIZE,
        batch_size=args.batch_size,
        validation_split=0.2,
        subset="validation",
        shuffle=True,
        seed=42,
    )
    class_names = train_ds.class_names
    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)

    model = build_model(len(class_names))
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=4,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=0.00005,
        ),
    ]
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks,
    )

    probabilities = model.predict(val_ds, verbose=0)
    predictions = np.argmax(probabilities, axis=1)
    y_true = np.concatenate([labels.numpy() for _images, labels in val_ds])
    print("\nEvaluation:")
    print(
        classification_report(
            y_true,
            predictions,
            labels=list(range(len(class_names))),
            target_names=class_names,
            zero_division=0,
        )
    )

    args.model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.model_path)
    metadata = {
        "classes": class_names,
        "input_size": list(DEFAULT_IMAGE_SIZE),
        "color_mode": "rgb",
        "model_type": "cnn",
    }
    args.model_path.with_suffix(".json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )
    print(f"\nSaved model: {args.model_path}")
    print(f"Saved metadata: {args.model_path.with_suffix('.json')}")


if __name__ == "__main__":
    main()
