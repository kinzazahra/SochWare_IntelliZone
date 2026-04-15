import numpy as np

class BehaviorPredictor:
    def __init__(self, max_history=10):
        self.history = {}  # person_id: list of positions
        self.max_history = max_history

    def _distance_to_box(self, point, box):
        """Compute shortest distance from point to rectangle (inside = 0)"""
        x, y = point
        x1, y1, x2, y2 = box

        x_min, x_max = min(x1, x2), max(x1, x2)
        y_min, y_max = min(y1, y2), max(y1, y2)

        dx = max(x_min - x, 0, x - x_max)
        dy = max(y_min - y, 0, y - y_max)

        return np.sqrt(dx**2 + dy**2)

    def analyze_behavior(self, person_id, current_pos, zone_coords):
        # -----------------------------
        # 1. Initialize history
        # -----------------------------
        if person_id not in self.history:
            self.history[person_id] = []

        self.history[person_id].append(current_pos)

        if len(self.history[person_id]) > self.max_history:
            self.history[person_id].pop(0)

        # -----------------------------
        # 2. Speed Calculation
        # -----------------------------
        speed = 0.0
        if len(self.history[person_id]) >= 2:
            p1 = np.array(self.history[person_id][-2], dtype=float)
            p2 = np.array(self.history[person_id][-1], dtype=float)
            speed = float(np.linalg.norm(p2 - p1))

        # -----------------------------
        # 3. Distance to Zone
        # -----------------------------
        dist_to_zone = self._distance_to_box(current_pos, zone_coords)

        # -----------------------------
        # 4. Risk Score Base
        # -----------------------------
        risk_score = 0

        # Near zone
        if dist_to_zone < 120:
            risk_score += 40

        # Very close
        if dist_to_zone < 80:
            risk_score += 40

        # Loitering (low speed)
        if speed < 3:
            risk_score += 25

        # -----------------------------
        # 5. Prolonged presence
        # -----------------------------
        if len(self.history[person_id]) >= 5:
            recent_positions = np.array(self.history[person_id][-5:])
            avg_movement = np.mean(
                np.linalg.norm(np.diff(recent_positions, axis=0), axis=1)
            )
            if avg_movement < 1.5:
                risk_score += 20

        # -----------------------------
        # 6. Direction Detection (NEW)
        # -----------------------------
        if len(self.history[person_id]) >= 2:
            prev = np.array(self.history[person_id][-2])
            curr = np.array(self.history[person_id][-1])

            movement = curr - prev

            zone_center = np.array([
                (zone_coords[0] + zone_coords[2]) / 2,
                (zone_coords[1] + zone_coords[3]) / 2
            ])

            to_zone = zone_center - curr

            # Moving toward zone
            if np.dot(movement, to_zone) > 0:
                risk_score += 15

        # -----------------------------
        # 7. Final Cap
        # -----------------------------
        risk_score = min(risk_score, 100)

        # -----------------------------
        # 8. Output
        # -----------------------------
        return {
            "speed": round(speed, 2),
            "distance": round(dist_to_zone, 2),
            "risk_score": risk_score,
            "status": "Suspicious" if risk_score > 50 else "Normal"
        }


class ActivityClassifier:
    def __init__(self, crouch_threshold=50):
        self.crouch_threshold = crouch_threshold

    def classify_pose(self, lmList):
        """
        Detect crouching/hiding based on shoulder-to-hip vertical distance
        lmList format assumed: [id, x, y]
        """
        if not lmList or len(lmList) < 25:
            return "Unknown"

        try:
            shoulder_y = (lmList[11][2] + lmList[12][2]) / 2.0
            hip_y = (lmList[23][2] + lmList[24][2]) / 2.0

            body_height = abs(hip_y - shoulder_y)

            if body_height < self.crouch_threshold:
                return "Crouching/Hiding"
            else:
                return "Standing"

        except (IndexError, TypeError):
            return "Unknown"