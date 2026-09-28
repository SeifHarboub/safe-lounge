"""Depth map for one cut-out dish: python depth.py photo.png cutout.png out-depth.png

Runs Depth Anything V2 (ONNX, onnx-community/depth-anything-v2-base) on the full
photo, keeps the dish only, then grows the edge depth past the cut-out so the
WebGL relief does not tear the silhouette when the dish tilts.
Needs: pip install onnxruntime numpy pillow, and model.onnx next to this file.
"""
import sys
from pathlib import Path
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

photo, cutout, out = sys.argv[1:4]
session = ort.InferenceSession(str(Path(__file__).with_name('model.onnx')))
rgb = Image.open(photo).convert('RGB')
alpha = np.asarray(Image.open(cutout).split()[-1], dtype=np.float32) / 255
x = np.asarray(rgb.resize((1036, 1036), Image.BICUBIC), dtype=np.float32) / 255
x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
depth = session.run(None, {session.get_inputs()[0].name: x})[0].squeeze()
depth = np.asarray(Image.fromarray(depth.astype(np.float32)).resize(rgb.size, Image.BICUBIC))
dish = alpha > .5
low, high = np.percentile(depth[dish], 1), np.percentile(depth[dish], 99.5)
depth = np.clip((depth - low) / (high - low), 0, 1)
grown = Image.fromarray((np.where(dish, depth, 0) * 255).astype(np.uint8))
for _ in range(12):
    grown = grown.filter(ImageFilter.MaxFilter(5))
merged = np.where(dish, depth * 255, np.asarray(grown, dtype=np.float32))
Image.fromarray(merged.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)).save(out)
