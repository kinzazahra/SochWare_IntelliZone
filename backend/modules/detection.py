import cv2
from cvzone.PoseModule import PoseDetector

class IntelliDetector:
    def __init__(self):
        self.detector = PoseDetector() #

    def get_frame_data(self, img):
        img = self.detector.findPose(img, draw=True) #
        lmList, bboxInfo = self.detector.findPosition(img, bboxWithHands=False) #
        
        center = None
        if bboxInfo:
            center = bboxInfo['center'] #
            
        return img, center