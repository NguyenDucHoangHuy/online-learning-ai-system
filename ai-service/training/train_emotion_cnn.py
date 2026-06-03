import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report


DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "emotion_raw"
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "emotion_cnn.keras"
DEFAULT_IMAGE_SIZE = (48, 48)


def build_model(class_count):
    inputs = tf.keras.Input(shape=(*DEFAULT_IMAGE_SIZE, 1))
    x = tf.keras.layers.Rescaling(1.0 / 255.0)(inputs)
    x = tf.keras.layers.RandomFlip("horizontal")(x)
    x = tf.keras.layers.RandomRotation(0.04)(x)
    x = tf.keras.layers.RandomZoom(0.08)(x)

    for filters in [32, 64, 128]:
        x = tf.keras.layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Activation("relu")(x)
        x = tf.keras.layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Activation("relu")(x)
        x = tf.keras.layers.MaxPooling2D()(x)
        x = tf.keras.layers.Dropout(0.18)(x)

    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.35)(x)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def class_weights_from_dataset(dataset, class_count):
    counts = np.zeros(class_count, dtype=np.float32)
    for _images, labels in dataset:
        values, batch_counts = np.unique(labels.numpy(), return_counts=True)
        counts[values] += batch_counts
    total = float(np.sum(counts))
    return {
        index: total / (class_count * max(float(counts[index]), 1.0))
        for index in range(class_count)
    }


def main():
    parser = argparse.ArgumentParser(description="Train deep learning emotion CNN.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--epochs", type=int, default=18)
    parser.add_argument("--batch-size", type=int, default=128)
    args = parser.parse_args()

    train_dir = args.data_dir / "train"
    test_dir = args.data_dir / "test"
    if not train_dir.exists() or not test_dir.exists():
        raise SystemExit("Expected emotion_raw/train and emotion_raw/test folders.")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels="inferred",
        label_mode="int",
        color_mode="grayscale",
        image_size=DEFAULT_IMAGE_SIZE,
        batch_size=args.batch_size,
        shuffle=True,
        seed=42,
    )
    test_ds = tf.keras.utils.image_dataset_from_directory(
        test_dir,
        labels="inferred",
        label_mode="int",
        color_mode="grayscale",
        image_size=DEFAULT_IMAGE_SIZE,
        batch_size=args.batch_size,
        shuffle=False,
    )
    class_names = train_ds.class_names
    class_count = len(class_names)
    weights = class_weights_from_dataset(train_ds, class_count)

    options = tf.data.Options()
    options.experimental_deterministic = False
    train_ds = train_ds.with_options(options).prefetch(tf.data.AUTOTUNE)
    test_ds = test_ds.prefetch(tf.data.AUTOTUNE)

    model = build_model(class_count)
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
        validation_data=test_ds,
        epochs=args.epochs,
        class_weight=weights,
        callbacks=callbacks,
    )

    probabilities = model.predict(test_ds, verbose=0)
    predictions = np.argmax(probabilities, axis=1)
    y_true = np.concatenate([labels.numpy() for _images, labels in test_ds])
    print("\nEvaluation:")
    print(classification_report(y_true, predictions, target_names=class_names, zero_division=0))

    args.model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.model_path)
    metadata = {
        "classes": class_names,
        "input_size": list(DEFAULT_IMAGE_SIZE),
        "color_mode": "grayscale",
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
