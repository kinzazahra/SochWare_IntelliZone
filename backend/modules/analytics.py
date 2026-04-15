import numpy as np
import cv2

class AnalyticsEngine:
    def __init__(self):
        self.heatmap_data = None
        self.width = 0
        self.height = 0

    def resize_heatmap(self, frame):
        h, w = frame.shape[:2]
        if self.heatmap_data is None or self.heatmap_data.shape != (h, w):
            self.height, self.width = h, w
            self.heatmap_data = np.zeros((h, w), dtype=np.float32)
            print(f"✅ Heatmap resized to {w}x{h}")

    def update_heatmap(self, center, intensity=1.0):
        if self.heatmap_data is None or center is None:
            return

        x = int(center[0])
        
        # 🔥 THE FIX: Shift the heat up by 150 pixels so it sits on the body, not the bottom edge!
        y = int(center[1]) - 150 

        # Keep it safely within the screen bounds
        x = max(0, min(x, self.width - 1))
        y = max(0, min(y, self.height - 1))

        overlay = np.zeros_like(self.heatmap_data)
        
        # Make the circle a bit larger (radius 60) so it's very clear on the dashboard
        boosted_intensity = float(intensity) * 10.0 
        cv2.circle(overlay, (x, y), 60, boosted_intensity, -1)
        
        self.heatmap_data = np.clip(self.heatmap_data + overlay, 0, 255)

    def apply_decay(self, decay_rate=0.98):
        if self.heatmap_data is not None:
            self.heatmap_data *= decay_rate

    def get_processed_heatmap(self):
        if self.heatmap_data is None:
            return None

        # 🔥 FIX 2: Smaller blur kernel. 
        # This keeps the center "hotter" while still giving a soft edge.
        blurred_heat = cv2.GaussianBlur(self.heatmap_data, (31, 31), 0)

        norm_heat = blurred_heat.astype(np.uint8)
        heatmap_color = cv2.applyColorMap(norm_heat, cv2.COLORMAP_JET)
        
        # 🔥 FIX 3: Lower the cutoff mask from 15 to 5.
        # This allows the faint green/blue glowing edges to survive.
        mask = norm_heat < 5 
        heatmap_color[mask] = [0, 0, 0]

        return heatmap_color

    def debug_stats(self):
        if self.heatmap_data is None:
            return {"min": 0, "max": 0, "mean": 0}
        return {
            "min": float(np.min(self.heatmap_data)),
            "max": float(np.max(self.heatmap_data)),
            "mean": float(np.mean(self.heatmap_data))
        }