from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import os
import sys
from PIL import Image
import io
import numpy as np
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Tambahkan parent directory ke PYTHONPATH
ROOT = Path(__file__).resolve().parent
YOLO_PATH = ROOT / "yolov9"
if str(YOLO_PATH) not in sys.path:
    sys.path.append(str(YOLO_PATH))

try:
    from yolov9.models.common import DetectMultiBackend
    from yolov9.utils.dataloaders import LoadImages
    from yolov9.utils.general import check_img_size, non_max_suppression, scale_boxes
    from yolov9.utils.torch_utils import select_device
except ImportError as e:
    print(f"Error importing YOLOv9 modules: {e}")
    print(f"Current PYTHONPATH: {sys.path}")
    sys.exit(1)

# Konfigurasi model
weights = ROOT / 'yolov9-rumah.pt'  # path ke model .pt
device = select_device('0' if torch.cuda.is_available() else 'cpu')
imgsz = (640, 640)

# Load model
try:
    model = DetectMultiBackend(weights, device=device)
    stride = model.stride
    imgsz = check_img_size(imgsz, s=stride)
    model.warmup(imgsz=(1, 3, *imgsz))
    print(f"Model berhasil dimuat pada device: {device}")
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

def process_image(image):
    # Konversi PIL Image ke format yang sesuai untuk YOLOv9
    img = torch.from_numpy(np.array(image)).to(device)
    img = img.float()
    img /= 255.0
    if len(img.shape) == 3:
        img = img[None]
    img = img.permute(0, 3, 1, 2)
    return img

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        # Baca gambar
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read())).convert('RGB')
        
        # Resize image
        image = image.resize(imgsz)
        
        # Process image
        img = process_image(image)
        
        # Inference
        pred = model(img)
        
        # NMS
        pred = non_max_suppression(pred, conf_thres=0.25, iou_thres=0.45, max_det=1000)
        
        # Process detections
        detections = []
        for i, det in enumerate(pred):
            if len(det):
                # Rescale boxes to original image
                det[:, :4] = scale_boxes(img.shape[2:], det[:, :4], image.size).round()
                
                # Results
                for *xyxy, conf, cls in det:
                    detections.append({
                        'label': model.names[int(cls)],
                        'confidence': float(conf),
                        'bbox': [float(x) for x in xyxy]
                    })
        
        return jsonify({'detections': detections})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)