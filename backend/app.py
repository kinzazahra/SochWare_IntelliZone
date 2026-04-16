from flask import Flask, Response, jsonify
from flask_cors import CORS
from flask import send_from_directory
from flask import send_file, make_response
import cv2
import pandas as pd
import numpy as np
import time
import os
import atexit
import threading
import csv
from datetime import datetime

from modules.detection import IntelliDetector
from modules.zones import ZoneManager
from modules.analysis import BehaviorPredictor
from modules.decision import DecisionModule
from modules.logging import EventLogger
from modules.analytics import AnalyticsEngine

# -----------------------------
# Initialize Flask App
# -----------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------
# Initialize modules
# -----------------------------
detector = IntelliDetector()
zone_mngr = ZoneManager()
predictor = BehaviorPredictor()
decision_engine = DecisionModule()
logger = EventLogger()
analytics = AnalyticsEngine()

# -----------------------------
# Camera Setup
# -----------------------------
cap = cv2.VideoCapture(0)
lock = threading.Lock()

# Global state
latest_status = "System Ready"
last_logged_time = 0

# -----------------------------
# Path Helper
# -----------------------------
def get_log_path():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, 'data', 'logs', 'event_logs.csv')

# -----------------------------
# Cleanup
# -----------------------------
def release_camera():
    if cap.isOpened():
        cap.release()

atexit.register(release_camera)

# -----------------------------
# Frame Processing
# -----------------------------
def process_frame(frame):
    global latest_status, last_logged_time

    # 1. Heatmap Setup
    analytics.resize_heatmap(frame)
    frame_blurred = cv2.GaussianBlur(frame, (5, 5), 0)

    # 2. Detection (This draws the Pink Tracking Box)
    img, center = detector.get_frame_data(frame_blurred)

    # 2.5 🛠️ ADDED THIS LINE: Draw the REAL Restricted & Warning Zones!
    img = zone_mngr.draw_all_zones(img)

    # 3. Processing
    if center:
        # 🔥 MOVE THE HEAT UP: Subtract 200 from Y to move glow from floor to body
        shifted_center = (center[0], center[1] - 300)
        
        analysis = predictor.analyze_behavior(
            person_id=1,
            current_pos=center,
            zone_coords=zone_mngr.zones["restricted"]["coords"]
        )

        active_zone = zone_mngr.check_zones(center)

        latest_status = decision_engine.process_decision(
            analysis["risk_score"],
            active_zone
        )

        # Update the heatmap with the shifted coordinate for the "Glow"
        analytics.update_heatmap(shifted_center, intensity=analysis["risk_score"])

        # 🛡️ 4. ULTRA-SAFE LOGGING BLOCK 🛡️
        try:
            current_time = time.time()
            status_str = str(latest_status)

            if ("WARNING" in status_str or "CRITICAL" in status_str) and (current_time - last_logged_time > 3.0):
                timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file_path = get_log_path()
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
                
                file_exists = os.path.isfile(log_file_path)
                is_empty = not file_exists or os.stat(log_file_path).st_size == 0
                
                with open(log_file_path, mode='a', newline='') as file:
                    writer = csv.writer(file)
                    if is_empty:
                        writer.writerow(["Timestamp", "Type", "Status"])
                    writer.writerow([timestamp_str, "Intrusion Attempt", status_str])

                # 📸 SCREENSHOT LOGIC
                if "CRITICAL" in status_str:
                    capture_dir = os.path.join(os.path.dirname(log_file_path), 'captures')
                    os.makedirs(capture_dir, exist_ok=True)
                    safe_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                    image_filename = os.path.join(capture_dir, f"intruder_{safe_time}.jpg")
                    cv2.imwrite(image_filename, img)
                    print(f"📸 SNAPSHOT SAVED: {image_filename}")

                last_logged_time = current_time

        except Exception as e:
            print(f"❌ [LOGGING FAILED]: {e}")

    return img

# -----------------------------
# Frame Generator
# -----------------------------
def generate_frames():
    while True:
        with lock:
            if not cap.isOpened():
                break
            success, frame = cap.read()

        if not success:
            time.sleep(0.1)
            continue

        # Slow decay for persistent glowing trails
        analytics.apply_decay(0.99)
        frame = process_frame(frame)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' +
            buffer.tobytes() +
            b'\r\n'
        )

# -----------------------------
# ROUTES
# -----------------------------

@app.route('/video_feed')
def video_feed():
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/get_logs')
def get_logs():
    try:
        log_file_path = get_log_path()
        if not os.path.exists(log_file_path):
            return jsonify([])
        df = pd.read_csv(log_file_path)
        return jsonify(df.tail(20).to_dict(orient='records'))
    except Exception as e:
        return jsonify([])

@app.route('/analytics/heatmap')
def get_heatmap():
    try:
        heatmap_color = analytics.get_processed_heatmap()
        if heatmap_color is None:
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            ret, buffer = cv2.imencode('.jpg', blank)
            return Response(buffer.tobytes(), mimetype='image/jpeg')

        ret, buffer = cv2.imencode('.jpg', heatmap_color)
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    except Exception as e:
        return Response(b'', mimetype='image/jpeg')

@app.route('/get_analytics_summary')
def get_analytics_summary():
    try:
        log_file_path = get_log_path()
        if not os.path.exists(log_file_path):
            return jsonify({"Secure": 1})

        df = pd.read_csv(log_file_path)
        if df.empty or "Status" not in df.columns:
            return jsonify({"Secure": 1})

        summary = df['Status'].value_counts().to_dict()
        return jsonify(summary)
    except Exception as e:
        return jsonify({"Secure": 1})

@app.route('/status')
def get_status():
    return jsonify({"status": latest_status})

@app.route('/')
def home():
    return jsonify({"message": "IntelliZone API is running"})


@app.route('/get_latest_capture')
def get_latest_capture():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        capture_dir = os.path.join(base_dir, 'data', 'logs', 'captures')
        
        if not os.path.exists(capture_dir):
            return "No captures", 404

        files = [os.path.join(capture_dir, f) for f in os.listdir(capture_dir) if f.endswith('.jpg')]
        if not files:
            return "No images", 404
            
        latest_file = max(files, key=os.path.getctime)
        
        # Create a response and clear the cache so the browser doesn't show old photos
        response = make_response(send_file(latest_file, mimetype='image/jpeg'))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        return response
    except Exception as e:
        print(f"Error serving image: {e}")
        return str(e), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False, threaded=True)