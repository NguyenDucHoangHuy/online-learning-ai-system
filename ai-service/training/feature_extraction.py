import math
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision


MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "face_landmarker.task"

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


def preprocess_image(image):
    image = cv2.resize(image, (320, 240))
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)
    enhanced = cv2.merge((enhanced_l, a_channel, b_channel))
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def get_face_landmark_analysis(image):
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    result = face_landmarker.detect(mp_image)

    if not result.face_landmarks:
        return None, {}

    height, width = image.shape[:2]
    landmarks = [
        {
            "x": float(point.x),
            "y": float(point.y),
            "z": float(point.z),
            "px": int(point.x * width),
            "py": int(point.y * height),
        }
        for point in result.face_landmarks[0]
    ]

    blendshapes = {}
    if result.face_blendshapes:
        blendshapes = {
            category.category_name: float(category.score)
            for category in result.face_blendshapes[0]
        }

    return landmarks, blendshapes


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
    camera_matrix = np.array(
        [[width, 0, width / 2], [0, width, height / 2], [0, 0, 1]],
        dtype="double",
    )
    success, rotation_vector, _ = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        np.zeros((4, 1)),
        flags=cv2.SOLVEPNP_ITERATIVE,
    )
    if not success:
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "is_frontal": 1.0}

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    sy = math.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
    if sy < 1e-6:
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
        "yaw": yaw_deg,
        "pitch": pitch_deg,
        "roll": roll_deg,
        "is_frontal": float(abs(yaw_deg) <= 25 and abs(pitch_deg) <= 22),
    }


def face_box_from_landmarks(landmarks):
    xs = [point["x"] for point in landmarks]
    ys = [point["y"] for point in landmarks]
    min_x = max(min(xs), 0)
    max_x = min(max(xs), 1)
    min_y = max(min(ys), 0)
    max_y = min(max(ys), 1)
    return {
        "face_x": min_x,
        "face_y": min_y,
        "face_w": max_x - min_x,
        "face_h": max_y - min_y,
    }


def extract_engagement_features(image):
    image = preprocess_image(image)
    landmarks, blendshapes = get_face_landmark_analysis(image)
    if not landmarks:
        return None

    head_pose = estimate_head_pose(landmarks, image.shape)
    face_box = face_box_from_landmarks(landmarks)
    features = {
        "head_yaw": head_pose["yaw"],
        "head_pitch": head_pose["pitch"],
        "head_roll": head_pose["roll"],
        "head_is_frontal": head_pose["is_frontal"],
        **face_box,
    }
    for key, value in blendshapes.items():
        features[f"blend_{key}"] = float(value)
    return features


def read_image(path):
    image = cv2.imread(str(path))
    if image is None:
        raise ValueError(f"Cannot read image: {path}")
    return image
