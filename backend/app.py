from flask import Flask, Response, jsonify, send_from_directory
from flask_cors import CORS
import csv
from datetime import datetime
import cv2
import pandas as pd
import numpy as np
import time
import os
import atexit
import threading

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

    # 2. Detection
    img, center = detector.get_frame_data(frame_blurred)

    # 3. Processing
    if center:
        # 🔥 Restore the Heatmap Shift! Shift the heat up by 150 pixels
        shifted_center = (center[0], center[1] - 150)
        
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

        analytics.update_heatmap(shifted_center, intensity=analysis["risk_score"])

        # 🚨 DEV TEST: Uncomment the line below to FORCE a warning without moving!
        # latest_status = "WARNING: Suspicious Approach"

        # 🛡️ 4. ULTRA-SAFE LOGGING BLOCK 🛡️
        try:
            current_time = time.time()
            status_str = str(latest_status)
            
            print(f"👀 System sees: {status_str} | Time since last log: {current_time - last_logged_time:.1f}s")

            if ("WARNING" in status_str or "CRITICAL" in status_str) and (current_time - last_logged_time > 3.0):
                import csv
                from datetime import datetime
                
                timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file_path = getattr(logger, 'log_file', 'logs.csv')
                
                # Check if file exists to determine if we need to write headers
                file_exists = os.path.isfile(log_file_path)
                is_empty = not file_exists or os.stat(log_file_path).st_size == 0
                
                with open(log_file_path, mode='a', newline='') as file:
                    writer = csv.writer(file)
                    # Write headers if the file is brand new/empty to fix the React table!
                    if is_empty:
                        writer.writerow(["Timestamp", "Type", "Status"])
                    
                    writer.writerow([timestamp_str, "Intrusion Attempt", status_str])

                print(f"✅ SUCCESS: Wrote to {log_file_path}!")
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

        # -----------------------------
        # 🔥 HEATMAP DECAY (CORRECT PLACE)
        # -----------------------------
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
        log_file_path = getattr(logger, 'log_file', 'logs.csv')
        if not os.path.exists(log_file_path):
            return jsonify([])

        # Use pandas to read the CSV
        df = pd.read_csv(log_file_path)
        
        # Return last 20 rows as a clean list of dictionaries
        return jsonify(df.tail(20).to_dict(orient='records'))
    except Exception as e:
        print(f"Error in get_logs: {e}")
        return jsonify([])


@app.route('/analytics/heatmap')
def get_heatmap():
    try:
        # Get the fully processed, glowing image from the analytics engine
        heatmap_color = analytics.get_processed_heatmap()
        
        if heatmap_color is None:
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "Waiting for video...", (180, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
            ret, buffer = cv2.imencode('.jpg', blank)
            return Response(buffer.tobytes(), mimetype='image/jpeg')

        # Add the debug text back over the finished image
        stats = analytics.debug_stats()
        cv2.putText(heatmap_color, f"min:{stats['min']:.1f}", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
        cv2.putText(heatmap_color, f"max:{stats['max']:.1f}", (10, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
        cv2.putText(heatmap_color, f"mean:{stats['mean']:.1f}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

        ret, buffer = cv2.imencode('.jpg', heatmap_color)
        if not ret:
             raise Exception("Failed to encode image")

        return Response(buffer.tobytes(), mimetype='image/jpeg')

    except Exception as e:
        print(f"[ERROR] heatmap: {e}")
        import traceback
        traceback.print_exc()
        error_img = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(error_img, "Error", (280, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
        ret, buffer = cv2.imencode('.jpg', error_img)
        return Response(buffer.tobytes(), mimetype='image/jpeg')


@app.route('/get_analytics_summary')
def get_analytics_summary():
    try:
        if not os.path.exists(logger.log_file):
            return jsonify({"Secure": 100})

        df = pd.read_csv(logger.log_file)

        if df.empty or "Status" not in df.columns:
            return jsonify({"Secure": 100})

        summary = df['Status'].value_counts().to_dict()
        return jsonify(summary)

    except Exception as e:
        print(f"[ERROR] analytics_summary: {e}")
        return jsonify({"Secure": 100})


@app.route('/status')
def get_status():
    return jsonify({"status": latest_status})


@app.route('/')
def home():
    return jsonify({
        "message": "IntelliZone API is running",
        "endpoints": [
            "/video_feed",
            "/get_logs",
            "/analytics/heatmap",
            "/get_analytics_summary",
            "/status"
        ]
    })


## -----------------------------
# RUN APP
# -----------------------------
if __name__ == "__main__":
    # Add use_reloader=False to stop the server from crashing when the CSV updates!
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False, threaded=True)