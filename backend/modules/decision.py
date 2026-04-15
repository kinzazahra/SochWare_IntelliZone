class DecisionModule:
    def process_decision(self, risk_score, active_zone):

        if active_zone == "restricted":
            if risk_score > 70:
                return "CRITICAL: Unauthorized Entry"
            elif risk_score > 40:
                return "WARNING: Suspicious Approach"
            else:
                return "SAFE"

        elif active_zone == "warning":
            if risk_score > 60:
                return "WARNING: Suspicious Approach"
            else:
                return "SAFE"

        return "SAFE"