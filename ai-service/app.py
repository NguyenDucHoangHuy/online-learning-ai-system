from collections import Counter, defaultdict, deque
import base64
import math
import os
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

app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).parent / "models" / "face_landmarker.task"
ENGAGEMENT_MODEL_PATH = Path(__file__).parent / "models" / "engagement_model.joblib"
EMOTION_MODEL_PATH = Path(__file__).parent / "models" / "emotion_model.joblib"
face_landmarker = vision.FaceLandmarker.create_from_options(
    vision.FaceLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(MODEL_PATH)),
        running_mode=vision.RunningMode.IMAGE,
        num_faces=1,
        min_face_detection_confidence=0.55,
        min_face_presence_confidence=0.55,
        min_tracking_confidence=0.5,
        output_face_blendshapes=True,
    )
)

emotion_history = defaultdict(lambda: deque(maxlen=5))
attention_history = defaultdict(lambda: deque(maxlen=5))
presence_history = defaultdict(lambda: deque(maxlen=5))
last_present_response = {}
engagement_model_artifact = None
emotion_model_artifact = None


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

EMOTION_TO_VI = {
    "happy": "vui vẻ",
    "sad": "buồn",
    "angry": "tức giận",
    "neutral": "bình thường",
    "surprise": "ngạc nhiên",
    "fear": "lo lắng",
    "disgust": "khó chịu",
}

FOCUSED_EMOTIONS = {"happy", "neutral", "surprise"}
UNFOCUSED_EMOTIONS = {"sad", "angry"}
MIN_EMOTION_CONFIDENCE = 0.28
DEEPFACE_MIN_CONFIDENCE = 0.35
USE_DEEPFACE = os.getenv("USE_DEEPFACE", "true").strip().lower() == "true"
EMOTION_MODEL_MIN_CONFIDENCE = 0.45
NEGATIVE_EMOTION_MIN_CONFIDENCE = 0.55

EMOTION_TO_VI.update(
    {
        "happy": "Vui vẻ",
        "sad": "Buồn",
        "angry": "Tức giận",
        "neutral": "Bình thường",
        "surprise": "Ngạc nhiên",
        "fear": "Lo lắng",
        "disgust": "Khó chịu",
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
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    result = face_landmarker.detect(mp_image)

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


def predict_emotion_with_model(face_image):
    if not emotion_model_artifact or face_image is None:
        return None

    try:
        model = emotion_model_artifact["model"]
        classes = emotion_model_artifact.get("classes", [])
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

    dominant = max(raw_scores, key=raw_scores.get)
    if strongest_expression < 0.16:
        dominant = "neutral"

    emotion_history[student_id].append(dominant)
    stable_emotion = Counter(emotion_history[student_id]).most_common(1)[0][0]

    total = sum(raw_scores.values()) or 1
    normalized_scores = {
        key: round((value / total) * 100, 2)
        for key, value in raw_scores.items()
    }
    confidence = normalized_scores.get(stable_emotion, 0) / 100

    return stable_emotion, round(confidence, 3), normalized_scores


def normalize_emotion_for_app(emotion):
    emotion = str(emotion or "neutral").lower()
    if emotion in {"normal", "neutral"}:
        return "neutral"
    if emotion == "disgust":
        return "angry"
    if emotion == "fear":
        return "sad"
    if emotion in {"happy", "sad", "angry", "surprise"}:
        return emotion
    return "neutral"


def build_absent_response(reason):
    response = {
        "presence": "absent",
        "status": "absent",
        "emotion": "no_face",
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

    if yaw > 32 or pitch > 28:
        return "unfocused", "LOW", False, "pose_rules"

    if emotion in UNFOCUSED_EMOTIONS and confidence >= NEGATIVE_EMOTION_MIN_CONFIDENCE:
        return "unfocused", "LOW", False, "emotion_rules"

    if not head_pose.get("is_frontal"):
        return "normal", "MEDIUM", True, "pose_rules"

    return "focused", "HIGH", True, "pose_rules"


def choose_emotion_result(face_crop, blendshapes, student_id):
    model_result = predict_emotion_with_model(face_crop)
    deepface_result = analyze_emotion_with_deepface(face_crop) if USE_DEEPFACE else None

    candidates = []
    if model_result:
        candidates.append(("emotion_model", *model_result))
    if deepface_result:
        candidates.append(("deepface", *deepface_result))

    if candidates:
        source, emotion, confidence, scores = max(candidates, key=lambda item: item[2])
        if confidence < MIN_EMOTION_CONFIDENCE:
            emotion = "neutral"
        emotion_history[student_id].append(normalize_emotion_for_app(emotion))
        stable_emotion = Counter(emotion_history[student_id]).most_common(1)[0][0]
        stable_confidence = round(float(scores.get(stable_emotion, confidence * 100)) / 100, 3)
        return stable_emotion, stable_confidence, scores, source

    emotion, confidence, scores = analyze_emotion_from_landmarks(blendshapes, student_id)
    return normalize_emotion_for_app(emotion), confidence, scores, "mediapipe_rules"


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
    stable_status = Counter(attention_history[student_key]).most_common(1)[0][0]
    if stable_status == status:
        return status, attention_level, is_focused

    stable_level = {
        "focused": "HIGH",
        "normal": "MEDIUM",
        "unfocused": "LOW",
    }.get(stable_status, attention_level)
    return stable_status, stable_level, stable_status != "unfocused"


def analyze_frame_payload(data):
    student_id = data.get("studentId", "unknown")
    student_key = f"{data.get('sessionId', 'default')}:{student_id}"
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
    face_crop = crop_face_from_box(image, face_box)
    emotion, confidence, emotion_scores, emotion_source = choose_emotion_result(
        face_crop,
        blendshapes,
        student_key,
    )
    focused_by_pose = head_pose["is_frontal"]
    focused_by_emotion = emotion not in UNFOCUSED_EMOTIONS or confidence < NEGATIVE_EMOTION_MIN_CONFIDENCE
    status, attention_level, is_focused, attention_source = decide_attention_from_rules(
        head_pose,
        emotion,
        confidence,
    )
    model_attention = predict_attention_with_model(head_pose, face_box, blendshapes)
    (
        status,
        attention_level,
        is_focused,
        attention_source,
        attention_confidence,
    ) = apply_model_attention(
        status,
        attention_level,
        is_focused,
        model_attention,
        focused_by_pose,
        focused_by_emotion,
    )
    status, attention_level, is_focused = stabilize_attention(
        student_key,
        status,
        attention_level,
        is_focused,
    )
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
        "blendshapes": blendshapes,
        "faceBox": face_box,
        "headPose": head_pose,
        "landmarks": [
            {
                "x": point["x"],
                "y": point["y"],
                "z": point["z"],
            }
            for point in landmarks
        ],
        "landmarkCount": len(landmarks),
        "reason": "ok",
    }
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
            "deepfaceAvailable": DEEPFACE_AVAILABLE,
            "deepfaceEnabled": USE_DEEPFACE,
            "engagementModelPath": str(ENGAGEMENT_MODEL_PATH),
            "emotionModelPath": str(EMOTION_MODEL_PATH),
        }
    )


@app.route("/test-emotion")
def test_emotion_page():
    return send_from_directory(Path(__file__).parent, "test_emotion.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
