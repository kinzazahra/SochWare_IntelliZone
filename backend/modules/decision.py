from datetime import datetime

class DecisionModule:
    def __init__(self):
        self.base_threshold = 0.6  # Standard daytime sensitivity

    def is_night_time(self):
        # 🌙 Night Sensitivity Window: 10 PM to 6 AM
        hour = datetime.now().hour
        return hour >= 22 or hour < 6

    def process_decision(self, risk_score, zone_type):
        # 1. 🛡️ ABSOLUTE CRITICAL: Physical breach of the restricted zone
        if zone_type == "restricted":
            return "CRITICAL: Unauthorized Entry"
        
        # 🌙 Adjust threshold for Night Time
        current_threshold = self.base_threshold
        if self.is_night_time():
            # Lower threshold means it's much easier to trigger an alert at night
            current_threshold = self.base_threshold * 0.6 # Becomes 0.36
        
        # 2. ⚡ PREDICTIVE CRITICAL: Even if not in a zone, fast approach is high risk
        # This triggers the looping alarm and photo immediately
        if risk_score > 0.85:
            return "CRITICAL: High-Speed Approach"

        # 3. ⚠️ WARNING: Significant suspicion based on behavior or location
        if risk_score > current_threshold:
            return "WARNING: Suspicious Approach"
        
        # 4. ✅ SAFE: Low movement or outside monitored areas
        return "SAFE"

        