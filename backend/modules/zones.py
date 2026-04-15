import cv2

class ZoneManager:
    def __init__(self):
        # Step 7: Zone Definitions (Multi-level security)
        self.zones = {
            "restricted": {"coords": [300, 100, 600, 400], "color": (0, 0, 255), "level": 3},
            "warning": {"coords": [200, 50, 700, 500], "color": (0, 255, 255), "level": 2}
        }

    def update_custom_zone(self, x1, y1, x2, y2, zone_type="restricted"):
        self.zones[zone_type]["coords"] = [x1, y1, x2, y2]

    def check_zones(self, center):
        if not center: return None
        cx, cy = center
        highest_threat = 0
        active_zone = None

        for name, data in self.zones.items():
            z = data["coords"]
            if z[0] < cx < z[2] and z[1] < cy < z[3]:
                if data["level"] > highest_threat:
                    highest_threat = data["level"]
                    active_zone = name
        return active_zone

    def draw_all_zones(self, img):
        for name, data in self.zones.items():
            z = data["coords"]
            cv2.rectangle(img, (z[0], z[1]), (z[2], z[3]), data["color"], 2)
            cv2.putText(img, f"{name.upper()} ZONE", (z[0], z[1]-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, data["color"], 1)
        return img