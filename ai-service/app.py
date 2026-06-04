from collections import Counter, defaultdict, deque
import base64
import math
import os
import threading
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

try:
    import joblib

    JOBLIB_AVAILABLE = True
except Exception as error:
    print("Joblib unavailable, engagement model disabled:", error)
    joblib = None
    JOBLIB_AVAILABLE = False

try:
    from deepface import DeepFace

    DEEPFACE_AVAILABLE = True
except Exception as error:
    print("DeepFace unavailable, using MediaPipe rule fallback:", error)
    DeepFace = None
    DEEPFACE_AVAILABLE = False

try:
    import tensorflow as tf

    TF_AVAILABLE = True
except Exception as error:
    print("TensorFlow unavailable, deep learning models disabled:", error)
    tf = None
    TF_AVAILABLE = False

app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).parent / "models" / "face_landmarker.task"
ENGAGEMENT_MODEL_PATH = Path(__file__).parent / "models" / "engagement_model.joblib"
EMOTION_MODEL_PATH = Path(__file__).parent / "models" / "emotion_model.joblib"
EYE_STATE_MODEL_PATH = Path(__file__).parent / "models" / "eye_state_model.joblib"
EMOTION_CNN_MODEL_PATH = Path(__file__).parent / "models" / "emotion_cnn.keras"
EYE_STATE_CNN_MODEL_PATH = Path(__file__).parent / "models" / "eye_state_cnn.keras"
face_landmarker = vision.FaceLandmarker.create_from_options(
    vision.FaceLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(MODEL_PATH)),
        running_mode=vision.RunningMode.VIDEO,
        num_faces=1,
        min_face_detection_confidence=0.55,
        min_face_presence_confidence=0.55,
        min_tracking_confidence=0.5,
        output_face_blendshapes=True,
    )
)

emotion_history = defaultdict(lambda: deque(maxlen=5))
emotion_score_history = defaultdict(lambda: deque(maxlen=5))
attention_history = defaultdict(lambda: deque(maxlen=5))
presence_history = defaultdict(lambda: deque(maxlen=5))
deepface_history = {}
deepface_frame_counts = defaultdict(int)
last_present_response = {}
landmark_timestamp_ms = 0
landmark_lock = threading.Lock()
engagement_model_artifact = None
emotion_model_artifact = None
eye_state_model_artifact = None
emotion_cnn_artifact = None
eye_state_cnn_artifact = None


def load_engagement_model():
    if not JOBLIB_AVAILABLE or joblib is None or not ENGAGEMENT_MODEL_PATH.exists():
        return None

    try:
        artifact = joblib.load(ENGAGEMENT_MODEL_PATH)
        if isinstance(artifact, dict) and "model" in artifact:
            print(f"Loaded engagement model: {ENGAGEMENT_MODEL_PATH}")
            return artifact
        print("Invalid engagement model artifact, using rule fallback")
        return None
    except Exception as error:
        print("Engagement model unavailable, using rule fallback:", error)
        return None


engagement_model_artifact = load_engagement_model()


def load_emotion_model():
    if not JOBLIB_AVAILABLE or joblib is None or not EMOTION_MODEL_PATH.exists():
        return None

    try:
        artifact = joblib.load(EMOTION_MODEL_PATH)
        if isinstance(artifact, dict) and "model" in artifact:
            print(f"Loaded emotion model: {EMOTION_MODEL_PATH}")
            return artifact
        print("Invalid emotion model artifact, using rule fallback")
        return None
    except Exception as error:
        print("Emotion model unavailable, using rule fallback:", error)
        return None


emotion_model_artifact = load_emotion_model()


def load_eye_state_model():
    if not JOBLIB_AVAILABLE or joblib is None or not EYE_STATE_MODEL_PATH.exists():
        return None

    try:
        artifact = joblib.load(EYE_STATE_MODEL_PATH)
        if isinstance(artifact, dict) and "model" in artifact:
            print(f"Loaded eye/yawn model: {EYE_STATE_MODEL_PATH}")
            return artifact
        print("Invalid eye/yawn model artifact, using MediaPipe fallback")
        return None
    except Exception as error:
        print("Eye/yawn model unavailable, using MediaPipe fallback:", error)
        return None


eye_state_model_artifact = load_eye_state_model()


def load_keras_artifact(model_path):
    metadata_path = model_path.with_suffix(".json")
    if not TF_AVAILABLE or tf is None or not model_path.exists() or not metadata_path.exists():
        return None

    try:
        model = tf.keras.models.load_model(model_path)
        import json

        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        print(f"Loaded deep learning model: {model_path}")
        return {"model": model, **metadata}
    except Exception as error:
        print(f"Deep learning model unavailable ({model_path}):", error)
        return None


emotion_cnn_artifact = load_keras_artifact(EMOTION_CNN_MODEL_PATH)
eye_state_cnn_artifact = load_keras_artifact(EYE_STATE_CNN_MODEL_PATH)

EMOTION_TO_VI = {
    "happy": "vui vẻ",
    "sad": "buồn",
    "angry": "tức giận",
    "neutral": "bình thường",
    "surprise": "ngạc nhiên",
    "fear": "lo l\u1eafng",
    "disgust": "kh\u00f3 ch\u1ecbu",
}

FOCUSED_EMOTIONS = {"happy", "neutral"}
UNFOCUSED_EMOTIONS = {"sleepy"}
MIN_EMOTION_CONFIDENCE = 0.28
DEEPFACE_MIN_CONFIDENCE = 0.35
USE_DEEPFACE = os.getenv("USE_DEEPFACE", "false").strip().lower() == "true"
INCLUDE_LANDMARKS = os.getenv("INCLUDE_LANDMARKS", "false").strip().lower() == "true"
DEEPFACE_INTERVAL = max(1, int(os.getenv("DEEPFACE_INTERVAL", "5")))
FAST_LANDMARK_EMOTION = os.getenv("FAST_LANDMARK_EMOTION", "true").strip().lower() == "true"
EMOTION_CNN_MIN_CONFIDENCE = 0.5
EMOTION_MODEL_MIN_CONFIDENCE = 0.68
EMOTION_ENSEMBLE_MIN_CONFIDENCE = 0.34
NEGATIVE_EMOTION_MIN_CONFIDENCE = 0.55
EYE_STATE_MODEL_MIN_CONFIDENCE = 0.72
EYE_STATE_CNN_MIN_CONFIDENCE = 0.92
EYE_RULE_MIN_CONFIDENCE = 0.74
LANDMARK_HAPPY_SMILE_MIN = 0.28
LANDMARK_SLEEPY_EYE_MIN = 0.68
LANDMARK_SLEEPY_MOUTH_MIN = 0.82
LANDMARK_YAWN_JAW_OPEN_MIN = 0.48
LANDMARK_BIG_YAWN_JAW_OPEN_MIN = 0.62
LANDMARK_YAWN_EYE_SUPPORT_MIN = 0.22
LANDMARK_YAWN_SMILE_GUARD_MAX = 0.52

EMOTION_TO_VI.update(
    {
        "happy": "Vui vẻ",
        "sad": "Buồn",
        "angry": "Tức giận",
        "neutral": "Bình thường",
        "surprise": "Ngạc nhiên",
        "fear": "Lo l\u1eafng",
        "disgust": "Kh\u00f3 ch\u1ecbu",
    }
)
EMOTION_TO_VI.update(
    {
        "happy": "Vui v\u1ebb",
        "sad": "Bu\u1ed3n",
        "angry": "T\u1ee9c gi\u1eadn",
        "neutral": "B\u00ecnh th\u01b0\u1eddng",
        "surprise": "Ng\u1ea1c nhi\u00ean",
        "fear": "Lo l\u1eafng",
        "disgust": "Kh\u00f3 ch\u1ecbu",
    }
)
EMOTION_TO_VI["sleepy"] = "Bu\u1ed3n ng\u1ee7"


def decode_base64_image(base64_string):
    try:
        encoded_data = base64_string.split(",", 1)[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as error:
        print("Decode error:", error)
        return None


def preprocess_image(image):
    try:
        image = cv2.resize(image, (320, 240))
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced_l = clahe.apply(l_channel)
        enhanced = cv2.merge((enhanced_l, a_channel, b_channel))
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    except Exception as error:
        print("Preprocess error:", error)
        return image


def get_face_landmark_analysis(image):
    global landmark_timestamp_ms
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    with landmark_lock:
        landmark_timestamp_ms += 33
        timestamp_ms = landmark_timestamp_ms
    result = face_landmarker.detect_for_video(mp_image, timestamp_ms)

    if not result.face_landmarks:
        return None, {}

    height, width = image.shape[:2]
    landmarks = result.face_landmarks[0]
    landmark_points = [
        {
            "x": float(point.x),
            "y": float(point.y),
            "z": float(point.z),
            "px": int(point.x * width),
            "py": int(point.y * height),
        }
        for point in landmarks
    ]

    blendshapes = {}
    if result.face_blendshapes:
        blendshapes = {
            category.category_name: round(float(category.score), 4)
            for category in result.face_blendshapes[0]
        }

    return landmark_points, blendshapes


def estimate_head_pose(landmarks, image_shape):
    height, width = image_shape[:2]
    landmark_ids = [1, 152, 33, 263, 61, 291]
    image_points = np.array(
        [[landmarks[index]["px"], landmarks[index]["py"]] for index in landmark_ids],
        dtype="double",
    )

    model_points = np.array(
        [
            (0.0, 0.0, 0.0),
            (0.0, -63.6, -12.5),
            (-43.3, 32.7, -26.0),
            (43.3, 32.7, -26.0),
            (-28.9, -28.9, -24.1),
            (28.9, -28.9, -24.1),
        ],
        dtype="double",
    )

    focal_length = width
    camera_matrix = np.array(
        [[focal_length, 0, width / 2], [0, focal_length, height / 2], [0, 0, 1]],
        dtype="double",
    )
    dist_coeffs = np.zeros((4, 1))

    success, rotation_vector, _translation_vector = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE,
    )

    if not success:
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "is_frontal": True}

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    sy = math.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
    singular = sy < 1e-6

    if singular:
        pitch = math.atan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
        yaw = math.atan2(-rotation_matrix[2, 0], sy)
        roll = 0
    else:
        pitch = math.atan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
        yaw = math.atan2(-rotation_matrix[2, 0], sy)
        roll = math.atan2(rotation_matrix[1, 0], rotation_matrix[0, 0])

    yaw_deg = math.degrees(yaw)
    pitch_deg = math.degrees(pitch)
    roll_deg = math.degrees(roll)

    return {
        "yaw": round(yaw_deg, 2),
        "pitch": round(pitch_deg, 2),
        "roll": round(roll_deg, 2),
        "is_frontal": abs(yaw_deg) <= 25 and abs(pitch_deg) <= 22,
    }


def face_box_from_landmarks(landmarks, image_shape):
    height, width = image_shape[:2]
    xs = [point["x"] for point in landmarks]
    ys = [point["y"] for point in landmarks]
    min_x = max(min(xs), 0)
    max_x = min(max(xs), 1)
    min_y = max(min(ys), 0)
    max_y = min(max(ys), 1)

    box_width = max_x - min_x
    box_height = max_y - min_y

    return {
        "x": round(min_x, 4),
        "y": round(min_y, 4),
        "w": round(box_width, 4),
        "h": round(box_height, 4),
        "px": int(min_x * width),
        "py": int(min_y * height),
        "pw": int(box_width * width),
        "ph": int(box_height * height),
    }


def crop_face_from_box(image, face_box, padding_ratio=0.18):
    height, width = image.shape[:2]
    x = face_box["px"]
    y = face_box["py"]
    w = face_box["pw"]
    h = face_box["ph"]

    padding_x = int(w * padding_ratio)
    padding_y = int(h * padding_ratio)
    x1 = max(0, x - padding_x)
    y1 = max(0, y - padding_y)
    x2 = min(width, x + w + padding_x)
    y2 = min(height, y + h + padding_y)

    if x2 <= x1 or y2 <= y1:
        return None

    return image[y1:y2, x1:x2]


def crop_aligned_face_from_landmarks(image, landmarks, padding_ratio=0.22):
    if not landmarks or len(landmarks) <= 362:
        return None

    try:
        height, width = image.shape[:2]
        left_eye = np.mean(
            [[landmarks[index]["px"], landmarks[index]["py"]] for index in [33, 133]],
            axis=0,
        )
        right_eye = np.mean(
            [[landmarks[index]["px"], landmarks[index]["py"]] for index in [362, 263]],
            axis=0,
        )
        eye_center = ((left_eye + right_eye) / 2.0).astype("float32")
        delta_y = float(right_eye[1] - left_eye[1])
        delta_x = float(right_eye[0] - left_eye[0])
        angle = math.degrees(math.atan2(delta_y, delta_x))

        rotation = cv2.getRotationMatrix2D(tuple(eye_center), angle, 1.0)
        rotated = cv2.warpAffine(
            image,
            rotation,
            (width, height),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE,
        )

        points = np.array([[point["px"], point["py"], 1.0] for point in landmarks], dtype="float32")
        rotated_points = points @ rotation.T
        min_x, min_y = np.min(rotated_points[:, :2], axis=0)
        max_x, max_y = np.max(rotated_points[:, :2], axis=0)
        box_size = max(max_x - min_x, max_y - min_y)
        padding = box_size * padding_ratio
        center_x = (min_x + max_x) / 2.0
        center_y = (min_y + max_y) / 2.0
        half_size = (box_size + padding * 2.0) / 2.0

        x1 = int(max(0, round(center_x - half_size)))
        y1 = int(max(0, round(center_y - half_size)))
        x2 = int(min(width, round(center_x + half_size)))
        y2 = int(min(height, round(center_y + half_size)))
        if x2 <= x1 or y2 <= y1:
            return None
        return rotated[y1:y2, x1:x2]
    except Exception as error:
        print("Aligned face crop fallback:", error)
        return None


def analyze_emotion_with_deepface(face_image):
    if not DEEPFACE_AVAILABLE or DeepFace is None or face_image is None:
        return None

    try:
        resized_face = cv2.resize(face_image, (224, 224))
        result = DeepFace.analyze(
            img_path=resized_face,
            actions=["emotion"],
            detector_backend="skip",
            enforce_detection=False,
            silent=True,
        )
        if isinstance(result, list):
            result = result[0] if result else {}

        emotion_scores = result.get("emotion", {}) or {}
        if not emotion_scores:
            return None

        normalized_scores = {
            key: round(float(value), 2)
            for key, value in emotion_scores.items()
        }
        dominant = str(result.get("dominant_emotion") or "").lower()
        if dominant not in normalized_scores:
            dominant = max(normalized_scores, key=normalized_scores.get)

        confidence = normalized_scores.get(dominant, 0) / 100
        if confidence < DEEPFACE_MIN_CONFIDENCE:
            dominant = "neutral"

        return dominant, round(confidence, 3), normalized_scores
    except Exception as error:
        print("DeepFace emotion fallback:", error)
        return None


def predict_emotion_with_cnn(face_image):
    if not emotion_cnn_artifact or face_image is None:
        return None

    try:
        model = emotion_cnn_artifact["model"]
        classes = emotion_cnn_artifact.get("classes", [])
        input_size = tuple(emotion_cnn_artifact.get("input_size", [48, 48]))
        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, input_size, interpolation=cv2.INTER_AREA)
        sample = resized.astype("float32")[None, ..., None]
        probabilities = model.predict(sample, verbose=0)[0]
        index = int(np.argmax(probabilities))
        confidence = round(float(probabilities[index]), 3)
        scores = {
            str(label): round(float(probability) * 100, 2)
            for label, probability in zip(classes, probabilities)
        }
        return normalize_emotion_for_app(classes[index]), confidence, scores
    except Exception as error:
        print("Emotion CNN prediction fallback:", error)
        return None


def predict_emotion_with_model(face_image):
    if not emotion_model_artifact or face_image is None:
        return None

    try:
        model = emotion_model_artifact["model"]
        classes = emotion_model_artifact.get("classes", [])
        feature_kind = emotion_model_artifact.get("feature_kind", "pixels_v1")
        if feature_kind == "hog_pixels_v1":
            input_size = tuple(emotion_model_artifact.get("input_size", [64, 64]))
            sample = extract_emotion_model_features(face_image, input_size)
        elif feature_kind == "pixels_eq_v2":
            input_size = tuple(emotion_model_artifact.get("input_size", [48, 48]))
            sample = extract_fast_emotion_model_features(face_image, input_size)
        else:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            resized = cv2.resize(gray, (48, 48), interpolation=cv2.INTER_AREA)
            sample = (resized.astype("float32") / 255.0).reshape(1, -1)
        prediction = str(model.predict(sample)[0]).lower()
        confidence = 0.5
        scores = {label: 0.0 for label in classes}

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(sample)[0]
            confidence = round(float(np.max(probabilities)), 3)
            scores = {
                str(label).lower(): round(float(probability) * 100, 2)
                for label, probability in zip(model.classes_, probabilities)
            }

        prediction = normalize_emotion_for_app(prediction)
        if confidence < EMOTION_MODEL_MIN_CONFIDENCE:
            prediction = "neutral"
        return prediction, confidence, scores
    except Exception as error:
        print("Emotion model prediction fallback:", error)
        return None


def create_emotion_hog_descriptor(image_size):
    width, height = image_size
    return cv2.HOGDescriptor(
        _winSize=(width, height),
        _blockSize=(16, 16),
        _blockStride=(8, 8),
        _cellSize=(8, 8),
        _nbins=9,
    )


def extract_emotion_model_features(image, image_size=(64, 64)):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, image_size, interpolation=cv2.INTER_AREA)
    equalized = cv2.equalizeHist(resized)
    hog = create_emotion_hog_descriptor(image_size).compute(equalized).reshape(-1)
    pixels = (equalized.astype("float32") / 255.0).reshape(-1)
    stats = np.array(
        [
            float(np.mean(equalized)) / 255.0,
            float(np.std(equalized)) / 255.0,
        ],
        dtype="float32",
    )
    return np.concatenate([hog.astype("float32"), pixels, stats]).reshape(1, -1)


def extract_fast_emotion_model_features(image, image_size=(48, 48)):
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
    return np.concatenate([pixels, stats]).reshape(1, -1)


def create_eye_state_hog_descriptor(image_size):
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
    hog = create_eye_state_hog_descriptor(image_size).compute(equalized).reshape(-1)
    pixels = (equalized.astype("float32") / 255.0).reshape(-1)
    stats = np.array(
        [
            float(np.mean(equalized)) / 255.0,
            float(np.std(equalized)) / 255.0,
        ],
        dtype="float32",
    )
    return np.concatenate([hog.astype("float32"), pixels, stats]).reshape(1, -1)


def predict_eye_state_with_model(face_image):
    if not eye_state_model_artifact or face_image is None:
        return None

    try:
        model = eye_state_model_artifact["model"]
        input_size = tuple(eye_state_model_artifact.get("input_size", [64, 64]))
        sample = extract_eye_state_features(face_image, input_size)
        prediction = str(model.predict(sample)[0])
        confidence = 0.5
        scores = {}

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(sample)[0]
            confidence = round(float(np.max(probabilities)), 3)
            scores = {
                str(label): round(float(probability) * 100, 2)
                for label, probability in zip(model.classes_, probabilities)
            }

        return prediction, confidence, scores
    except Exception as error:
        print("Eye/yawn model prediction fallback:", error)
        return None


def predict_eye_state_with_cnn(face_image):
    if not eye_state_cnn_artifact or face_image is None:
        return None

    try:
        model = eye_state_cnn_artifact["model"]
        classes = eye_state_cnn_artifact.get("classes", [])
        input_size = tuple(eye_state_cnn_artifact.get("input_size", [96, 96]))
        rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, input_size, interpolation=cv2.INTER_AREA)
        sample = resized.astype("float32")[None, ...]
        probabilities = model.predict(sample, verbose=0)[0]
        index = int(np.argmax(probabilities))
        confidence = round(float(probabilities[index]), 3)
        scores = {
            str(label): round(float(probability) * 100, 2)
            for label, probability in zip(classes, probabilities)
        }
        return str(classes[index]), confidence, scores
    except Exception as error:
        print("Eye/yawn CNN prediction fallback:", error)
        return None


def analyze_eye_yawn_from_landmarks(blendshapes):
    def score(name):
        return float(blendshapes.get(name, 0))

    blink = (score("eyeBlinkLeft") + score("eyeBlinkRight")) / 2
    squint = (score("eyeSquintLeft") + score("eyeSquintRight")) / 2
    wide = (score("eyeWideLeft") + score("eyeWideRight")) / 2
    jaw_open = score("jawOpen")
    smile = (score("mouthSmileLeft") + score("mouthSmileRight")) / 2

    closed_score = max(0.0, blink * 0.82 + squint * 0.28 - wide * 0.18)
    eye_support = max(blink, squint, closed_score)
    yawn_score = max(0.0, jaw_open * 0.92 + eye_support * 0.24 - smile * 0.18 - wide * 0.08)
    open_score = max(0.0, wide * 0.68 + (1.0 - blink) * 0.28)

    is_big_yawn = (
        jaw_open >= LANDMARK_BIG_YAWN_JAW_OPEN_MIN
        and smile <= LANDMARK_YAWN_SMILE_GUARD_MAX
    )
    is_sleepy_yawn = (
        jaw_open >= LANDMARK_YAWN_JAW_OPEN_MIN
        and eye_support >= LANDMARK_YAWN_EYE_SUPPORT_MIN
        and smile <= LANDMARK_YAWN_SMILE_GUARD_MAX
    )

    if is_big_yawn or is_sleepy_yawn or yawn_score >= EYE_RULE_MIN_CONFIDENCE:
        confidence = min(0.99, round(max(yawn_score, jaw_open), 3))
        return "yawn", confidence, {
            "Closed": round(closed_score * 100, 2),
            "Open": round(open_score * 100, 2),
            "yawn": round(confidence * 100, 2),
        }

    if closed_score >= EYE_RULE_MIN_CONFIDENCE:
        return "Closed", min(0.99, round(closed_score, 3)), {
            "Closed": round(closed_score * 100, 2),
            "Open": round(open_score * 100, 2),
            "yawn": round(yawn_score * 100, 2),
        }

    return "Open", min(0.99, round(open_score, 3)), {
        "Closed": round(closed_score * 100, 2),
        "Open": round(open_score * 100, 2),
        "yawn": round(yawn_score * 100, 2),
    }


def choose_eye_state_result(face_crop, blendshapes):
    landmark_result = analyze_eye_yawn_from_landmarks(blendshapes)
    cnn_result = predict_eye_state_with_cnn(face_crop)
    model_result = predict_eye_state_with_model(face_crop)
    landmark_label, landmark_confidence, _landmark_scores = landmark_result

    if cnn_result:
        cnn_label, cnn_confidence, cnn_scores = cnn_result
        landmark_agrees = (
            cnn_label == landmark_label
            or (cnn_label in {"Closed", "yawn"} and landmark_label in {"Closed", "yawn"})
        )
        if (
            cnn_label in {"Closed", "yawn"}
            and cnn_confidence >= EYE_STATE_CNN_MIN_CONFIDENCE
            and landmark_confidence >= EYE_RULE_MIN_CONFIDENCE
            and landmark_agrees
        ):
            return cnn_label, cnn_confidence, cnn_scores, "eye_state_cnn"

    if model_result:
        model_label, model_confidence, model_scores = model_result
        if model_label in {"Closed", "yawn"} and model_confidence >= EYE_STATE_MODEL_MIN_CONFIDENCE:
            return model_label, model_confidence, model_scores, "eye_state_model"

    label, confidence, scores = landmark_result
    return label, confidence, scores, "mediapipe_eye_rules"


def analyze_priority_emotion_from_landmarks(blendshapes):
    def score(name):
        return float(blendshapes.get(name, 0))

    smile = (score("mouthSmileLeft") + score("mouthSmileRight")) / 2
    cheek_squint = (score("cheekSquintLeft") + score("cheekSquintRight")) / 2
    blink = (score("eyeBlinkLeft") + score("eyeBlinkRight")) / 2
    squint = (score("eyeSquintLeft") + score("eyeSquintRight")) / 2
    wide = (score("eyeWideLeft") + score("eyeWideRight")) / 2
    jaw_open = score("jawOpen")

    closed_score = max(0.0, blink * 0.88 + squint * 0.18 - wide * 0.12)
    eye_support = max(blink, squint, closed_score)
    mouth_sleepy_score = max(0.0, jaw_open * 0.95 + eye_support * 0.22 - smile * 0.22)
    happy_score = max(0.0, smile * 1.18 + cheek_squint * 0.22 - blink * 0.12)

    if closed_score >= EYE_RULE_MIN_CONFIDENCE:
        confidence = min(0.99, round(closed_score, 3))
        return "sleepy", confidence, {
            "sleepy": round(confidence * 100, 2),
            "happy": round(max(0.0, happy_score) * 100, 2),
            "neutral": round(max(0.0, (1.0 - confidence)) * 100, 2),
        }, "eyes_closed_landmark"

    is_big_yawn = (
        jaw_open >= LANDMARK_BIG_YAWN_JAW_OPEN_MIN
        and smile <= LANDMARK_YAWN_SMILE_GUARD_MAX
    )
    is_sleepy_yawn = (
        jaw_open >= LANDMARK_YAWN_JAW_OPEN_MIN
        and eye_support >= LANDMARK_YAWN_EYE_SUPPORT_MIN
        and smile <= LANDMARK_YAWN_SMILE_GUARD_MAX
    )

    if is_big_yawn or is_sleepy_yawn or mouth_sleepy_score >= LANDMARK_SLEEPY_MOUTH_MIN:
        confidence = min(0.99, round(max(mouth_sleepy_score, jaw_open), 3))
        return "sleepy", confidence, {
            "sleepy": round(confidence * 100, 2),
            "happy": round(max(0.0, happy_score) * 100, 2),
            "neutral": round(max(0.0, (1.0 - confidence)) * 100, 2),
        }, "mouth_open_landmark"

    if happy_score >= LANDMARK_HAPPY_SMILE_MIN and smile >= 0.2:
        confidence = min(0.99, round(happy_score, 3))
        return "happy", confidence, {
            "happy": round(confidence * 100, 2),
            "sleepy": round(max(closed_score, mouth_sleepy_score) * 100, 2),
            "neutral": round(max(0.0, (1.0 - confidence)) * 100, 2),
        }, "smile_landmark"

    if closed_score >= LANDMARK_SLEEPY_EYE_MIN and happy_score < LANDMARK_HAPPY_SMILE_MIN:
        confidence = min(0.99, round(closed_score, 3))
        return "sleepy", confidence, {
            "sleepy": round(confidence * 100, 2),
            "happy": round(max(0.0, happy_score) * 100, 2),
            "neutral": round(max(0.0, (1.0 - confidence)) * 100, 2),
        }, "eyes_closed_landmark"

    return None


def analyze_fast_landmark_emotion(blendshapes):
    priority_result = analyze_priority_emotion_from_landmarks(blendshapes)
    if priority_result:
        return priority_result

    scores = {
        "neutral": 100.0,
        "happy": 0.0,
        "sleepy": 0.0,
    }
    return "neutral", 0.72, scores, "neutral_landmark"


def analyze_emotion_from_landmarks(blendshapes, student_id):
    def score(name):
        return float(blendshapes.get(name, 0))

    smile = (score("mouthSmileLeft") + score("mouthSmileRight")) / 2
    frown = (score("mouthFrownLeft") + score("mouthFrownRight")) / 2
    eye_wide = (score("eyeWideLeft") + score("eyeWideRight")) / 2
    eye_squint = (score("eyeSquintLeft") + score("eyeSquintRight")) / 2
    cheek_squint = (score("cheekSquintLeft") + score("cheekSquintRight")) / 2
    brow_down = (score("browDownLeft") + score("browDownRight")) / 2
    brow_inner_up = score("browInnerUp")
    jaw_open = score("jawOpen")
    nose_sneer = (score("noseSneerLeft") + score("noseSneerRight")) / 2

    raw_scores = {
        "happy": smile * 1.25 + cheek_squint * 0.35,
        "sad": frown * 0.95 + brow_inner_up * 0.45 - smile * 0.25,
        "angry": brow_down * 0.95 + eye_squint * 0.45 + frown * 0.25,
        "surprise": jaw_open * 0.75 + eye_wide * 0.7 + brow_inner_up * 0.35,
        "fear": eye_wide * 0.55 + brow_inner_up * 0.45 + jaw_open * 0.25 - smile * 0.2,
        "disgust": nose_sneer * 0.95 + brow_down * 0.25,
    }
    raw_scores = {key: max(0.0, value) for key, value in raw_scores.items()}

    strongest_expression = max(raw_scores.values(), default=0)
    raw_scores["neutral"] = max(0.12, 0.48 - strongest_expression)

    if strongest_expression < 0.16:
        raw_scores["neutral"] = max(raw_scores["neutral"], 0.62)

    total = sum(raw_scores.values()) or 1
    normalized_scores = {
        key: round((value / total) * 100, 2)
        for key, value in raw_scores.items()
    }
    dominant = max(normalized_scores, key=normalized_scores.get)
    confidence = normalized_scores.get(dominant, 0) / 100

    return dominant, round(confidence, 3), normalized_scores


def normalize_emotion_for_app(emotion):
    emotion = str(emotion or "neutral").lower()
    if emotion in {"normal", "neutral"}:
        return "neutral"
    if emotion in {"happy", "sad", "angry", "surprise", "fear", "disgust", "sleepy"}:
        return emotion
    return "neutral"


def normalize_emotion_scores(scores):
    normalized = {
        "angry": 0.0,
        "disgust": 0.0,
        "fear": 0.0,
        "happy": 0.0,
        "neutral": 0.0,
        "sad": 0.0,
        "surprise": 0.0,
    }
    for label, score in (scores or {}).items():
        emotion = normalize_emotion_for_app(label)
        if emotion in normalized:
            normalized[emotion] += max(0.0, float(score))

    total = sum(normalized.values())
    if total <= 0:
        normalized["neutral"] = 1.0
        return normalized
    if total > 1.01:
        return {label: value / 100.0 for label, value in normalized.items()}
    return normalized


def blend_emotion_results(results):
    blended = {
        "angry": 0.0,
        "disgust": 0.0,
        "fear": 0.0,
        "happy": 0.0,
        "neutral": 0.0,
        "sad": 0.0,
        "surprise": 0.0,
    }
    total_weight = 0.0

    for _source, weight, scores in results:
        probabilities = normalize_emotion_scores(scores)
        confidence_scale = max(probabilities.values(), default=0.0)
        adjusted_weight = weight * max(0.35, confidence_scale)
        total_weight += adjusted_weight
        for emotion, probability in probabilities.items():
            blended[emotion] += probability * adjusted_weight

    if total_weight <= 0:
        blended["neutral"] = 1.0
        return blended
    return {emotion: value / total_weight for emotion, value in blended.items()}


def stabilize_emotion_from_scores(student_key, scores):
    emotion_score_history[student_key].append(scores)
    averaged = {
        emotion: float(np.mean([frame_scores.get(emotion, 0.0) for frame_scores in emotion_score_history[student_key]]))
        for emotion in scores
    }
    stable_emotion = max(averaged, key=averaged.get)
    stable_confidence = round(float(averaged[stable_emotion]), 3)
    emotion_history[student_key].append(stable_emotion)
    voted_emotion = Counter(emotion_history[student_key]).most_common(1)[0][0]
    voted_confidence = round(float(averaged.get(voted_emotion, stable_confidence)), 3)
    return voted_emotion, voted_confidence, averaged


def build_absent_response(reason):
    response = {
        "presence": "absent",
        "status": "absent",
        "emotion": "absent",
        "emotionLabel": "vắng mặt",
        "attentionLabel": "Vắng mặt",
        "isFocused": False,
        "confidence": 0,
        "reason": reason,
        "landmarkCount": 0,
    }
    response["emotionLabel"] = "Vắng mặt"
    response["attentionLabel"] = "Vắng mặt"
    return response


def build_engagement_features(head_pose, face_box, blendshapes):
    features = {
        "head_yaw": float(head_pose.get("yaw", 0)),
        "head_pitch": float(head_pose.get("pitch", 0)),
        "head_roll": float(head_pose.get("roll", 0)),
        "head_is_frontal": 1.0 if head_pose.get("is_frontal") else 0.0,
        "face_x": float(face_box.get("x", 0)),
        "face_y": float(face_box.get("y", 0)),
        "face_w": float(face_box.get("w", 0)),
        "face_h": float(face_box.get("h", 0)),
    }
    for key, value in blendshapes.items():
        features[f"blend_{key}"] = float(value)
    return features


def normalize_model_attention_label(label):
    text = str(label).strip().lower().replace("-", "_").replace(" ", "_")
    if text in {"high", "engaged", "focused", "focusing", "attentive", "2"}:
        return "HIGH", "focused", True
    if text in {"medium", "normal", "neutral", "average", "moderate", "1"}:
        return "MEDIUM", "normal", True
    return "LOW", "unfocused", False


def predict_attention_with_model(head_pose, face_box, blendshapes):
    if not engagement_model_artifact:
        return None

    try:
        model = engagement_model_artifact["model"]
        feature_columns = engagement_model_artifact.get("feature_columns", [])
        features = build_engagement_features(head_pose, face_box, blendshapes)
        values = np.array([[features.get(column, 0.0) for column in feature_columns]])
        prediction = model.predict(values)[0]
        attention_level, status, is_focused = normalize_model_attention_label(prediction)

        attention_confidence = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(values)[0]
            attention_confidence = round(float(np.max(probabilities)), 3)

        return {
            "status": status,
            "attentionLevel": attention_level,
            "isFocused": is_focused,
            "attentionConfidence": attention_confidence,
            "attentionSource": "engagement_model",
        }
    except Exception as error:
        print("Engagement model prediction fallback:", error)
        return None


def apply_model_attention(
    current_status,
    current_attention_level,
    current_is_focused,
    model_attention,
    focused_by_pose,
    focused_by_emotion,
):
    if not model_attention:
        return current_status, current_attention_level, current_is_focused, "rules", None

    model_level = model_attention["attentionLevel"]
    model_confidence = model_attention["attentionConfidence"] or 0

    if focused_by_pose and focused_by_emotion:
        if model_level in {"HIGH", "MEDIUM"}:
            return "focused", "HIGH", True, "engagement_model", model_confidence
        return (
            current_status,
            current_attention_level,
            current_is_focused,
            "rules_with_model_guard",
            model_confidence,
        )

    if not focused_by_pose and model_level == "LOW":
        return "unfocused", "LOW", False, "engagement_model", model_confidence

    if model_confidence >= 0.62:
        return (
            model_attention["status"],
            model_level,
            model_attention["isFocused"],
            "engagement_model",
            model_confidence,
        )

    return (
        current_status,
        current_attention_level,
        current_is_focused,
        "rules_with_model_hint",
        model_confidence,
    )


def decide_attention_from_rules(head_pose, emotion, confidence):
    yaw = abs(float(head_pose.get("yaw", 0)))
    pitch = abs(float(head_pose.get("pitch", 0)))

    is_extreme_pose = yaw > 45 or pitch > 40
    is_clearly_away = yaw > 34 or pitch > 30

    if emotion in UNFOCUSED_EMOTIONS and confidence >= MIN_EMOTION_CONFIDENCE:
        return "unfocused", "LOW", False, "emotion_rules"

    if emotion in FOCUSED_EMOTIONS:
        return "focused", "HIGH", True, "emotion_rules"

    if is_extreme_pose:
        return "unfocused", "LOW", False, "pose_rules"

    if is_clearly_away:
        return "normal", "MEDIUM", True, "pose_rules"

    if not head_pose.get("is_frontal"):
        return "normal", "MEDIUM", True, "pose_rules"

    if emotion in FOCUSED_EMOTIONS:
        return "focused", "HIGH", True, "emotion_rules"

    return "normal", "MEDIUM", True, "pose_rules"


def choose_emotion_result(face_crop, blendshapes, student_id):
    if FAST_LANDMARK_EMOTION:
        emotion, confidence, scores, source = analyze_fast_landmark_emotion(blendshapes)
        eye_label, eye_confidence, eye_scores = analyze_eye_yawn_from_landmarks(blendshapes)
        eye_source = "mediapipe_eye_rules"
        if source == "eyes_closed_landmark":
            eye_label = "Closed"
            eye_confidence = confidence
            eye_source = source
            eye_scores = {"Closed": round(confidence * 100, 2), "Open": 0.0, "yawn": 0.0}
        elif source == "mouth_open_landmark":
            eye_label = "yawn"
            eye_confidence = confidence
            eye_source = source
            eye_scores = {"Closed": 0.0, "Open": 0.0, "yawn": round(confidence * 100, 2)}
        emotion_history[student_id].append(emotion)
        return (
            emotion,
            confidence,
            scores,
            source,
            {
                "label": eye_label,
                "confidence": eye_confidence,
                "scores": eye_scores,
                "source": eye_source,
            },
        )

    priority_emotion = analyze_priority_emotion_from_landmarks(blendshapes)
    if priority_emotion:
        emotion, confidence, scores, source = priority_emotion
        eye_label, eye_confidence, eye_scores, eye_source = analyze_eye_yawn_from_landmarks(blendshapes)
        if source == "eyes_closed_landmark":
            eye_label = "Closed"
            eye_confidence = confidence
            eye_source = source
            eye_scores = {"Closed": round(confidence * 100, 2), "Open": 0.0, "yawn": 0.0}
        elif source == "mouth_open_landmark":
            eye_label = "yawn"
            eye_confidence = confidence
            eye_source = source
            eye_scores = {"Closed": 0.0, "Open": 0.0, "yawn": round(confidence * 100, 2)}
        emotion_history[student_id].append(emotion)
        return (
            emotion,
            confidence,
            scores,
            source,
            {
                "label": eye_label,
                "confidence": eye_confidence,
                "scores": eye_scores,
                "source": eye_source,
            },
        )

    cnn_result = predict_emotion_with_cnn(face_crop)
    model_result = predict_emotion_with_model(face_crop)
    eye_state = choose_eye_state_result(face_crop, blendshapes)
    eye_label, eye_confidence, eye_scores, eye_source = eye_state
    landmark_result = analyze_emotion_from_landmarks(blendshapes, student_id)
    landmark_emotion, landmark_confidence, landmark_scores = landmark_result

    if eye_label in {"Closed", "yawn"} and eye_confidence >= EYE_RULE_MIN_CONFIDENCE:
        return (
            "sleepy",
            eye_confidence,
            eye_scores,
            eye_source,
            {
                "label": eye_label,
                "confidence": eye_confidence,
                "scores": eye_scores,
                "source": eye_source,
            },
        )

    ensemble_inputs = []
    sources = []
    if cnn_result:
        cnn_emotion, cnn_confidence, cnn_scores = cnn_result
        if cnn_confidence >= EMOTION_ENSEMBLE_MIN_CONFIDENCE:
            ensemble_inputs.append(("emotion_cnn", 0.58, cnn_scores))
            sources.append(("emotion_cnn", cnn_emotion, cnn_confidence))

    if model_result:
        model_emotion, model_confidence, model_scores = model_result
        if model_confidence >= EMOTION_ENSEMBLE_MIN_CONFIDENCE:
            ensemble_inputs.append(("emotion_model", 0.24, model_scores))
            sources.append(("emotion_model", model_emotion, model_confidence))

    deepface_result = None
    if USE_DEEPFACE:
        deepface_result = analyze_emotion_with_deepface(face_crop)
        if deepface_result:
            deepface_emotion, deepface_confidence, deepface_scores = deepface_result
            if deepface_confidence >= DEEPFACE_MIN_CONFIDENCE:
                ensemble_inputs.append(("deepface", 0.18, deepface_scores))
                sources.append(("deepface", deepface_emotion, deepface_confidence))

    if landmark_confidence >= MIN_EMOTION_CONFIDENCE:
        landmark_weight = 0.22 if landmark_emotion != "neutral" else 0.14
        ensemble_inputs.append(("mediapipe_blendshapes", landmark_weight, landmark_scores))
        sources.append(("mediapipe_blendshapes", landmark_emotion, landmark_confidence))

    if ensemble_inputs:
        blended_scores = blend_emotion_results(ensemble_inputs)
        stable_emotion, stable_confidence, stable_scores = stabilize_emotion_from_scores(
            student_id,
            blended_scores,
        )
        if stable_confidence < MIN_EMOTION_CONFIDENCE:
            stable_emotion = "neutral"
        display_scores = {
            emotion: round(probability * 100, 2)
            for emotion, probability in stable_scores.items()
        }
        source_names = "+".join(source for source, _weight, _scores in ensemble_inputs)
        return (
            stable_emotion,
            stable_confidence,
            display_scores,
            f"ensemble:{source_names}",
            {
                "label": eye_label,
                "confidence": eye_confidence,
                "scores": eye_scores,
                "source": eye_source,
            },
        )

    emotion, confidence, scores = landmark_result
    return (
        normalize_emotion_for_app(emotion),
        confidence,
        scores,
        "mediapipe_rules",
        {
            "label": eye_label,
            "confidence": eye_confidence,
            "scores": eye_scores,
            "source": eye_source,
        },
    )


def maybe_hold_last_present(student_key, reason):
    presence_history[student_key].append("absent")
    absent_count = Counter(presence_history[student_key]).get("absent", 0)
    cached = last_present_response.get(student_key)
    if cached and absent_count < 3:
        guarded = dict(cached)
        guarded["reason"] = f"{reason}_temporary_guard"
        guarded["presenceGuarded"] = True
        return guarded
    return build_absent_response(reason)


def stabilize_attention(student_key, status, attention_level, is_focused):
    attention_history[student_key].append(status)

    if status == "focused":
        return status, attention_level, is_focused

    stable_status = Counter(attention_history[student_key]).most_common(1)[0][0]
    if stable_status == status:
        return status, attention_level, is_focused

    stable_level = {
        "focused": "HIGH",
        "normal": "MEDIUM",
        "unfocused": "LOW",
    }.get(stable_status, attention_level)
    return stable_status, stable_level, stable_status != "unfocused"


def decide_fixed_attention_policy(emotion, eye_state):
    eye_label = str((eye_state or {}).get("label") or "")
    eye_confidence = float((eye_state or {}).get("confidence") or 0)

    if emotion == "sleepy" or (
        eye_label in {"Closed", "yawn"} and eye_confidence >= MIN_EMOTION_CONFIDENCE
    ):
        return {
            "status": "unfocused",
            "attentionLevel": "LOW",
            "isFocused": False,
            "attentionSource": "fixed_sleepy_policy",
            "attentionConfidence": max(eye_confidence, 0.0),
        }

    if emotion in {"happy", "neutral"}:
        return {
            "status": "focused",
            "attentionLevel": "HIGH",
            "isFocused": True,
            "attentionSource": "fixed_emotion_policy",
            "attentionConfidence": None,
        }

    return {
        "status": "normal",
        "attentionLevel": "MEDIUM",
        "isFocused": True,
        "attentionSource": "fixed_emotion_policy",
        "attentionConfidence": None,
    }


def analyze_frame_payload(data):
    student_id = data.get("studentId", "unknown")
    student_key = f"{data.get('sessionId', 'default')}:{student_id}"
    include_landmarks = INCLUDE_LANDMARKS or bool(data.get("includeLandmarks"))
    image = decode_base64_image(data.get("image", ""))

    if image is None:
        return maybe_hold_last_present(student_key, "decode_failed")

    image = preprocess_image(image)
    landmarks, blendshapes = get_face_landmark_analysis(image)

    if not landmarks:
        return maybe_hold_last_present(student_key, "no_face_landmarks")

    face_box = face_box_from_landmarks(landmarks, image.shape)
    if face_box["pw"] < 60 or face_box["ph"] < 60:
        return maybe_hold_last_present(student_key, "face_too_far")

    presence_history[student_key].append("present")
    head_pose = estimate_head_pose(landmarks, image.shape)
    face_crop = None
    if not FAST_LANDMARK_EMOTION:
        face_crop = crop_aligned_face_from_landmarks(image, landmarks)
        if face_crop is None:
            face_crop = crop_face_from_box(image, face_box)
    emotion, confidence, emotion_scores, emotion_source, eye_state = choose_emotion_result(
        face_crop,
        blendshapes,
        student_key,
    )
    fixed_attention = decide_fixed_attention_policy(emotion, eye_state)
    status = fixed_attention["status"]
    attention_level = fixed_attention["attentionLevel"]
    is_focused = fixed_attention["isFocused"]
    attention_source = fixed_attention["attentionSource"]
    attention_confidence = fixed_attention["attentionConfidence"]
    attention_label = {
        "focused": "T\u1eadp trung",
        "unfocused": "Kh\u00f4ng t\u1eadp trung",
        "normal": "B\u00ecnh th\u01b0\u1eddng",
    }.get(status, "B\u00ecnh th\u01b0\u1eddng")

    emotion_label = (
        "Ch\u01b0a r\u00f5"
        if confidence < MIN_EMOTION_CONFIDENCE
        else EMOTION_TO_VI.get(emotion, emotion)
    )

    response = {
        "presence": "present",
        "status": status,
        "emotion": emotion,
        "emotionLabel": emotion_label,
        "emotionSource": emotion_source,
        "attentionLabel": attention_label,
        "attentionLevel": attention_level,
        "attentionSource": attention_source,
        "attentionConfidence": attention_confidence,
        "isFocused": is_focused,
        "confidence": confidence,
        "emotionScores": emotion_scores,
        "eyeState": eye_state,
        "blendshapes": blendshapes,
        "faceBox": face_box,
        "headPose": head_pose,
        "landmarkCount": len(landmarks),
        "reason": "ok",
    }
    if include_landmarks:
        response["landmarks"] = [
            {
                "x": point["x"],
                "y": point["y"],
                "z": point["z"],
            }
            for point in landmarks
        ]
    last_present_response[student_key] = response
    return response


@app.route("/analyze-student-frame", methods=["POST"])
def analyze_student_frame():
    try:
        data = request.json or {}
        if "image" not in data:
            return jsonify(build_absent_response("no_image"))

        return jsonify(analyze_frame_payload(data))
    except Exception as error:
        print("AI error:", error)
        return jsonify({**build_absent_response("error"), "error": str(error)})


@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    try:
        data = request.json or {}
        if "image" not in data:
            return jsonify(build_absent_response("no_image"))

        result = analyze_frame_payload(data)
        return jsonify(
            {
                "status": result["status"],
                "emotion": result["emotion"],
                "focus_score": 100 if result["isFocused"] else 35,
                "distracted_score": 0 if result["isFocused"] else 65,
                "face_confidence": result["confidence"],
                "emotion_scores": result.get("emotionScores", {}),
                "region": result.get("faceBox", {}),
            }
        )
    except Exception as error:
        print("AI error:", error)
        return jsonify({"status": "absent", "emotion": "error", "error": str(error)})


@app.route("/")
def home():
    return "AI Emotion Service Running..."


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "engagementModelLoaded": engagement_model_artifact is not None,
            "emotionModelLoaded": emotion_model_artifact is not None,
            "eyeStateModelLoaded": eye_state_model_artifact is not None,
            "emotionCnnLoaded": emotion_cnn_artifact is not None,
            "eyeStateCnnLoaded": eye_state_cnn_artifact is not None,
            "deepfaceAvailable": DEEPFACE_AVAILABLE,
            "deepfaceEnabled": USE_DEEPFACE,
            "fastLandmarkEmotion": FAST_LANDMARK_EMOTION,
            "landmarkRunningMode": "VIDEO",
            "engagementModelPath": str(ENGAGEMENT_MODEL_PATH),
            "emotionModelPath": str(EMOTION_MODEL_PATH),
            "eyeStateModelPath": str(EYE_STATE_MODEL_PATH),
            "emotionCnnModelPath": str(EMOTION_CNN_MODEL_PATH),
            "eyeStateCnnModelPath": str(EYE_STATE_CNN_MODEL_PATH),
        }
    )


@app.route("/test-emotion")
def test_emotion_page():
    return send_from_directory(Path(__file__).parent, "test_emotion.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
