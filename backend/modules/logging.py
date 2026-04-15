import os
import cv2
import datetime
import pandas as pd
import requests


class EventLogger:
    def __init__(self):
        # Base directory relative to this file
        self.base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "data")
        )

        self.log_dir = os.path.join(self.base_dir, "logs")
        self.screenshot_dir = os.path.join(self.base_dir, "screenshots")

        # Ensure directories exist
        os.makedirs(self.log_dir, exist_ok=True)
        os.makedirs(self.screenshot_dir, exist_ok=True)

        self.log_file = os.path.join(self.log_dir, "event_logs.csv")

        self._initialize_log_file()

    def _initialize_log_file(self):
        """Create CSV file if it doesn't exist"""
        if not os.path.exists(self.log_file):
            df = pd.DataFrame(columns=[
                "Timestamp", "Type", "Status", "Location", "Screenshot"
            ])
            df.to_csv(self.log_file, index=False)

    def _save_screenshot(self, frame):
        """Save frame as image and return file path"""
        now = datetime.datetime.now()
        file_timestamp = now.strftime("%Y%m%d_%H%M%S")

        filename = f"alert_{file_timestamp}.jpg"
        path = os.path.join(self.screenshot_dir, filename)

        try:
            success = cv2.imwrite(path, frame)
            if not success:
                raise Exception("cv2.imwrite returned False")
        except Exception as e:
            print(f"[ERROR] Screenshot save failed: {e}")
            return None

        return path

    def log_event(self, frame, alert_type, status, location="Restricted Zone A"):
        """Log event and store screenshot"""

        now = datetime.datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        screenshot_path = self._save_screenshot(frame)

        new_event = {
            "Timestamp": timestamp,
            "Type": alert_type,
            "Status": status,
            "Location": location,
            "Screenshot": screenshot_path or ""
        }

        try:
            df = pd.DataFrame([new_event])

            # Append efficiently
            file_exists = os.path.exists(self.log_file)
            is_empty = not file_exists or os.stat(self.log_file).st_size == 0

            df.to_csv(
                self.log_file,
                mode='a',
                header=is_empty,
                index=False
            )

        except Exception as e:
            print(f"[ERROR] Log write failed: {e}")

        return new_event


class NotificationSystem:
    def __init__(self, webhook_url=None, timeout=5):
        self.webhook_url = webhook_url
        self.timeout = timeout

    def send_mobile_alert(self, message, image_path=None):
        """Send alert via webhook (Discord / Slack / etc.)"""

        # Local fallback
        if not self.webhook_url:
            print(f"[ALERT] {message}")
            return False

        payload = {
            "content": f"🚨 IntelliZone Alert 🚨\n{message}"
        }

        try:
            if image_path and os.path.exists(image_path):
                with open(image_path, "rb") as img:
                    response = requests.post(
                        self.webhook_url,
                        data=payload,
                        files={"file": img},
                        timeout=self.timeout
                    )
            else:
                response = requests.post(
                    self.webhook_url,
                    json=payload,
                    timeout=self.timeout
                )

            if response.status_code in (200, 204):
                return True

            print(f"[ERROR] Webhook failed: {response.status_code}")
            return False

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Notification failed: {e}")
            return False