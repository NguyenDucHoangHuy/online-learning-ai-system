from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from collections import Counter, deque
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

# realtime hơn -> chỉ giữ 1 frame gần nhất
emotion_history = deque(maxlen=1)


# =========================
# Decode base64 image
# =========================
def decode_base64_image(base64_string):
    try:
        encoded_data = base64_string.split(",")[1]

        nparr = np.frombuffer(
            base64.b64decode(encoded_data),
            np.uint8
        )

        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    except Exception as e:
        print("Decode Error:", e)
        return None


# =========================
# Preprocess image
# =========================
def preprocess_face(image):
    try:
        # tăng resolution
        image = cv2.resize(image, (800, 600))

        # tăng sáng
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        clahe = cv2.createCLAHE(
            clipLimit=4.0,
            tileGridSize=(8, 8)
        )

        cl = clahe.apply(l)

        merged = cv2.merge((cl, a, b))
        image = cv2.cvtColor(
            merged,
            cv2.COLOR_LAB2BGR
        )

        # giảm noise
        image = cv2.fastNlMeansDenoisingColored(
            image,
            None,
            10,
            10,
            7,
            21
        )

        return image

    except Exception as e:
        print("Preprocess Error:", e)
        return image


# =========================
# Emotion Detection API
# =========================
@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    global emotion_history

    try:
        data = request.json

        # không có ảnh
        if not data or "image" not in data:
            return jsonify({
                "status": "absent",
                "emotion": "no_image"
            })

        # decode image
        image = decode_base64_image(data["image"])

        if image is None:
            return jsonify({
                "status": "absent",
                "emotion": "decode_failed"
            })

        # preprocess
        image = preprocess_face(image)

        # deepface analyze
        result = DeepFace.analyze(
            image,
            actions=["emotion"],
            detector_backend="mtcnn",
            enforce_detection=False
        )

        # không detect được face
        if not result:
            return jsonify({
                "status": "absent",
                "emotion": "no_face"
            })

        result = result[0]

        emotion_scores = result["emotion"]
        dominant_emotion = result["dominant_emotion"]
        face_confidence = result.get("face_confidence", 0)

        region = result.get("region", {})
        face_width = region.get("w", 0)
        face_height = region.get("h", 0)

        print("\n===================")
        print("Emotion Scores:", emotion_scores)
        print("Dominant Emotion:", dominant_emotion)
        print("Face Confidence:", face_confidence)
        print("Face Size:", face_width, face_height)

        # mặt quá xa
        if face_width < 80 or face_height < 80:
            return jsonify({
                "status": "absent",
                "emotion": "face_too_far"
            })

        # confidence thấp
        if face_confidence < 0.4:
            return jsonify({
                "status": "absent",
                "emotion": "low_confidence"
            })

        current_score = float(
            emotion_scores[dominant_emotion]
        )

        print("Current Score:", current_score)

        # nếu emotion hiện tại mạnh -> dùng luôn
        if current_score >= 55:
            stable_emotion = dominant_emotion
        else:
            emotion_history.append(dominant_emotion)

            stable_emotion = Counter(
                emotion_history
            ).most_common(1)[0][0]

        print("Stable Emotion:", stable_emotion)

        # tính focus score
        focus_score = (
            float(emotion_scores["happy"]) +
            float(emotion_scores["neutral"]) +
            float(emotion_scores["surprise"])
        )

        distracted_score = (
            float(emotion_scores["sad"]) +
            float(emotion_scores["angry"]) +
            float(emotion_scores["fear"]) +
            float(emotion_scores["disgust"])
        )

        # mapping trạng thái học tập
        if stable_emotion in ["happy", "neutral"]:
            status = "focused"

        elif stable_emotion in ["sad", "fear"]:
            status = "distracted"

        elif stable_emotion in ["angry", "disgust"]:
            status = "unfocused"

        elif stable_emotion == "surprise":
            status = "normal"

        else:
            status = "normal"

        # fix numpy float32
        clean_scores = {
            key: round(float(value), 2)
            for key, value in emotion_scores.items()
        }

        return jsonify({
            "status": status,
            "emotion": stable_emotion,
            "focus_score": round(focus_score, 2),
            "distracted_score": round(distracted_score, 2),
            "face_confidence": round(float(face_confidence), 2),
            "emotion_scores": clean_scores,
             "region": region
        })

    except Exception as e:
        print("AI Error:", e)

        return jsonify({
            "status": "absent",
            "emotion": "error",
            "error": str(e)
        })


# =========================
# Home
# =========================
@app.route("/")
def home():
    return "AI Emotion Service Running..."


# =========================
# Run Flask
# =========================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )