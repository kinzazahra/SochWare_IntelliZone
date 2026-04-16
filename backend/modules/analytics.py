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
        if center and self.heatmap_data is not None:
            x, y = center
            # Limit coordinates to frame boundaries
            x = min(max(int(x), 0), self.width - 1)
            y = min(max(int(y), 0), self.height - 1)
            
            # Draw the "heat" point onto our float32 data layer
            # We use a larger radius (40) and add value to create a "hot spot"
            radius = 15
            mask = np.zeros_like(self.heatmap_data)
            cv2.circle(mask, (x, y), radius, intensity * 50, -1)
            
            # Add this new heat to the existing data
            self.heatmap_data = cv2.add(self.heatmap_data, mask)

    def apply_decay(self, decay_rate=0.98):
        if self.heatmap_data is not None:
            self.heatmap_data *= decay_rate

    def get_processed_heatmap(self):
        if self.heatmap_data is None:
            return None

        # 1. Apply a HEAVY blur to create the "Glowing Cloud" look
        # This blends the points into soft vapor
        blurred_heat = cv2.GaussianBlur(self.heatmap_data, (51, 51), 0)

        # 2. Normalize and convert to 8-bit color
        # We clip it at 255 so it doesn't get too bright
        norm_heat = np.clip(blurred_heat, 0, 255).astype(np.uint8)
        
        # 3. Apply the JET colormap (Blue -> Green -> Red)
        heatmap_color = cv2.applyColorMap(norm_heat, cv2.COLORMAP_JET)
        
        # 4. Mask out the empty background so it stays black
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