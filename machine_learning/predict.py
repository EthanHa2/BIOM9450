# predict.py
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Load trained components
model = joblib.load("rf_cancer_predictor.pkl")
scaler = joblib.load("scaler.pkl")
le_label = joblib.load("label_encoder.pkl")

# Read JSON input from PHP
input_data = json.loads(sys.stdin.read())

# Extract relevant fields
chromosome_start = input_data.get("chromosome_start")
chromosome_end = input_data.get("chromosome_end")
mutated_from_allele = input_data.get("mutated_from_allele")
mutated_to_allele = input_data.get("mutated_to_allele")
gene_affected = input_data.get("gene_affected")

# Create dataframe for model
df = pd.DataFrame([{
    "chromosome_start": chromosome_start,
    "chromosome_end": chromosome_end,
    "mutated_from_allele": mutated_from_allele,
    "mutated_to_allele": mutated_to_allele,
    "gene_affected": gene_affected
}])

# Encode categorical columns (same order as training)
for col in ["mutated_from_allele", "mutated_to_allele", "gene_affected"]:
    df[col] = df[col].astype("category").cat.codes

# Scale features
X_scaled = scaler.transform(df)

pred = model.predict(X_scaled)[0]
pred_label = le_label.inverse_transform([pred])[0]

# Confidence (probability of the predicted class)
try:
    probas = model.predict_proba(X_scaled)[0]
    confidence = float(np.max(probas) * 100)
except Exception:
    confidence = None

# Format result
if confidence is not None:
    result_text = f"{pred_label} ({confidence:.1f}% confidence)"
else:
    result_text = f"{pred_label} (confidence unavailable)"

# Output JSON result for PHP
output = {
    "predicted_cancer_type": pred_label,
    "confidence_percent": round(confidence, 2) if confidence else None,
    "display_text": result_text
}