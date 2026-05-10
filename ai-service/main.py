from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
import base64
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os

os.environ["TF_USE_LEGACY_KERAS"] = "1"

# ======================================================
# 1. NẠP MÔ HÌNH CUSTOM
# ======================================================
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

def load_custom_model(model_path):
    model = models.resnet18()
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, 2) 
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model

model_ai = load_custom_model("engagement_model.pt")
display_class_names = ['Focusing', 'Distracted'] 

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ImageRequest(BaseModel):
    image: str

@app.post("/analyze")
async def analyze(req: ImageRequest):
    try:
        # Giải mã ảnh
        image_data = req.image.split(",")[1]
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        h_img, w_img, _ = frame.shape

        # BƯỚC 1: QUÉT SỰ HIỆN DIỆN
        objs = DeepFace.extract_faces(frame, detector_backend='opencv', enforce_detection=False)
        
        if len(objs) == 0 or (objs[0]['confidence'] < 0.05):
             return {"status": "Away", "emotion": "No Person"}

        # BƯỚC 2: CẮT VÙNG PHÂN TÍCH (MỞ RỘNG KHUNG QUÉT)
        face_info = objs[0]['facial_area']
        fx, fy, fw, fh = face_info['x'], face_info['y'], face_info['w'], face_info['h']
        
        if (fw * fh) / (w_img * h_img) < 0.01: 
            return {"status": "Away", "emotion": "Too far or No one"}

        # Tăng padding từ 0.25 lên 0.5 (mở rộng 50% kích thước khuôn mặt ra các phía)
        # Điều này giúp khung quét bao trọn đầu và vai
        padding_w = int(fw * 0.5)
        padding_h = int(fh * 0.5)
        
        x1, y1 = max(0, fx - padding_w), max(0, fy - padding_h)
        x2, y2 = min(w_img, fx + fw + padding_w), min(h_img, fy + fh + padding_h)
        face_crop = frame[y1:y2, x1:x2]

        # BƯỚC 3: DỰ ĐOÁN TRẠNG THÁI
        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(face_rgb)
        input_tensor = preprocess(pil_img).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model_ai(input_tensor)
            _, preds = torch.max(outputs, 1)
            engagement = display_class_names[preds[0]]

        # Logic bổ sung: Nếu bị khuất mặt nhưng vẫn có bóng người
        if objs[0]['confidence'] < 0.2:
            engagement = "Distracted"

        # BƯỚC 4: LẤY CẢM XÚC (Vẫn dựa trên vùng đã mở rộng hoặc cắt lại nếu cần)
        try:
            # Lưu ý: analyze cũng có thể chạy trên face_crop đã mở rộng
            results = DeepFace.analyze(face_crop, actions=["emotion"], enforce_detection=False)
            raw_emotion = results[0]["dominant_emotion"]
            final_emotion = raw_emotion if raw_emotion in ["happy", "neutral"] else "neutral"
        except:
            final_emotion = "neutral"

        return {
            "status": engagement,   
            "emotion": final_emotion
        }

    except Exception:
        return {"status": "Away", "emotion": "Offline"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)