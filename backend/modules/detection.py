import cv2
from cvzone.PoseModule import PoseDetector

class IntelliDetector:
    def __init__(self):
        self.detector = PoseDetector() #

    def get_frame_data(self, img):
        if img is None or img.size == 0:
            return img, None

        try:
            # 1. Create a fresh copy of the image to avoid memory conflicts
            img_input = img.copy()
            
            # 2. Run the detection
            img = self.detector.findPose(img_input, draw=True)
            lmList, bboxInfo = self.detector.findPosition(img, draw=True, bboxWithHands=False)
            
            center = None
            if bboxInfo:
                center = bboxInfo["center"]
                
            return img, center

        except Exception as e:
            # 🛡️ THE CRASH SHIELD:
            # If MediaPipe throws that "Timestamp Mismatch" or "Empty Packet" error,
            # we just catch it, wait 1ms, and return the original frame.
            # This prevents the whole server from crashing.
            # print(f"⚠️ MediaPipe Sync Issue: {e}") # Optional: uncomment to see glitches
            return img, None