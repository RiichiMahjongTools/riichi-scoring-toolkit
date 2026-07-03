# Riichi tile YOLO model

Put the exported ONNX model here:

```text
public/models/riichi-tile-yolo/riichi-37-yolo11n-640.onnx
```

Export from the training workspace with:

```powershell
.\.venv\Scripts\yolo.exe export model=runs/mahjong/riichi-37-yolo11n-640-all/weights/best.pt format=onnx imgsz=640 simplify=True nms=False
```

The frontend expects the 37-class label order from `datasets/merged-riichi-37-all/data.yaml`:
`0m, 0p, 0s, 1m...9s, 1z...7z`.
