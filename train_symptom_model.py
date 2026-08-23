"""
train_symptom_model.py

Trains a classifier on the disease-symptom dataset to predict probable
disease from a list of symptoms. Uses the itachi9604 Kaggle dataset format:
https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset

Expected input CSV: dataset.csv with columns like:
Disease, Symptom_1, Symptom_2, ... Symptom_17 (one row per disease occurrence,
symptom columns may have blanks/NaN if fewer symptoms apply)

If your downloaded CSV has different column names, adjust the COLUMN NAMES
section below to match - print(df.columns) first to check.
"""

from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import cross_val_score
import joblib

# ============ STEP 1: Load data ============
DATASET_PATH = Path(__file__).resolve().parent / "dataset" / "Symptom" / "dataset.csv"
df = pd.read_csv(DATASET_PATH)
print("Dataset:", DATASET_PATH)
print("Columns found:", df.columns.tolist())
print("Shape:", df.shape)
print(df.head())

# ============ STEP 2: Clean and reshape data ============
# Symptom columns typically look like: Symptom_1, Symptom_2, ... Symptom_17
symptom_cols = [col for col in df.columns if "Symptom" in col]

# Strip whitespace from symptom values (common issue in this dataset)
for col in symptom_cols:
    df[col] = df[col].astype(str).str.strip().replace("nan", np.nan)

# Combine all symptom columns into a single list per row, dropping NaNs
df["symptom_list"] = df[symptom_cols].apply(
    lambda row: [s for s in row if pd.notna(s)], axis=1
)

# ============ STEP 3: Encode symptoms as multi-hot features ============
# Each unique symptom becomes its own binary column (1 if present, 0 if not)
mlb = MultiLabelBinarizer()
X = mlb.fit_transform(df["symptom_list"])
print(f"\nTotal unique symptoms used as features: {len(mlb.classes_)}")

# ============ STEP 4: Encode target labels (disease names) ============
le = LabelEncoder()
y = le.fit_transform(df["Disease"])
print(f"Total unique diseases (classes): {len(le.classes_)}")

# ============ STEP 5: Train/test split ============
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ============ STEP 6: Train the model ============
# Random Forest is a strong, easy-to-explain baseline for this kind of
# tabular multi-symptom classification task - good choice for a semester project
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ============ STEP 7: Evaluate ============
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy: {accuracy:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

# 5-fold cross-validation for a more reliable accuracy estimate
cv_scores = cross_val_score(model, X, y, cv=5)
print(f"\nCross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# ============ STEP 8: Save the trained model + encoders ============
# You need all three files to make predictions later - the model alone isn't enough
joblib.dump(model, "symptom_disease_model.pkl")
joblib.dump(mlb, "symptom_binarizer.pkl")
joblib.dump(le, "disease_label_encoder.pkl")
print("\nModel and encoders saved: symptom_disease_model.pkl, symptom_binarizer.pkl, disease_label_encoder.pkl")

# ============ STEP 9: Example prediction function ============
def predict_disease(symptom_list, top_n=3):
    """
    Given a list of symptom strings (must match the exact naming/spelling
    used in the training dataset, e.g. 'high_fever', 'headache'),
    returns the top N most likely diseases with confidence scores.
    """
    input_vector = mlb.transform([symptom_list])
    probabilities = model.predict_proba(input_vector)[0]

    top_indices = np.argsort(probabilities)[::-1][:top_n]
    results = [
        {"disease": le.classes_[i], "confidence": round(float(probabilities[i]), 3)}
        for i in top_indices
    ]
    return results


# Example usage - replace with actual symptom names from your dataset
if __name__ == "__main__":
    example_symptoms = ["high_fever", "headache", "vomiting"]
    print(f"\nExample prediction for symptoms {example_symptoms}:")
    try:
        predictions = predict_disease(example_symptoms)
        for p in predictions:
            print(f"  {p['disease']}: {p['confidence']*100:.1f}% confidence")
    except Exception as e:
        print(f"  (Adjust example_symptoms to match actual symptom names in your dataset: {e})")
