import sys
import cv2
import mediapipe as mp
import json

def get_smart_framing(video_path):
    mp_face_detection = mp.solutions.face_detection
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        return {"error": "Could not open video"}

    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Sample frames (every 3 seconds to be faster)
    sample_interval = max(1, int(fps * 3))
    face_positions = []

    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
        for i in range(0, total_frames, sample_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            success, image = cap.read()
            if not success:
                break
            
            # Convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_detection.process(image_rgb)
            
            if results.detections:
                # Get the first detection (usually the most prominent)
                bbox = results.detections[0].location_data.relative_bounding_box
                # Calculate center X
                center_x = bbox.xmin + (bbox.width / 2)
                face_positions.append(center_x)

    cap.release()

    if not face_positions:
        return {"x_offset_pct": 0.5} # Default to center

    # Average face position
    avg_x = sum(face_positions) / len(face_positions)
    return {"x_offset_pct": avg_x}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python smart_framing.py <video_path>")
        sys.exit(1)
        
    try:
        result = get_smart_framing(sys.argv[1])
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
