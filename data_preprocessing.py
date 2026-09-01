"""Prepare the disease/symptom CSV files for model training."""
from pathlib import Path
import json
import pickle
import pandas as pd
from sklearn.preprocessing import LabelEncoder

DATA_DIR = Path("dataset") / "Symptom"


def main() -> None:
    """Load raw data, build one-hot symptoms, and persist training artifacts."""
    data = pd.read_csv(DATA_DIR / "dataset.csv")
    symptom_columns = [c for c in data.columns if c.lower().startswith("symptom_")]
    if "Disease" not in data.columns or not symptom_columns:
        raise ValueError("dataset.csv must contain Disease and Symptom_* columns")

    # Normalize every symptom cell; missing values represent no symptom.
    symptoms = data[symptom_columns].fillna("").astype(str).apply(lambda col: col.str.strip().str.lower())
    all_symptoms = sorted({value for value in symptoms.to_numpy().ravel() if value})
    feature_matrix = pd.DataFrame(0, index=data.index, columns=all_symptoms, dtype="int8")
    for column in symptoms.columns:
        for row_index, value in symptoms[column].items():
            if value:
                feature_matrix.at[row_index, value] = 1

    # Encode disease labels and retain the fitted encoder for inference.
    labels = data["Disease"].astype(str).str.strip()
    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(labels)

    # Combine descriptions and precautions into a convenient disease lookup.
    descriptions = pd.read_csv(DATA_DIR / "symptom_Description.csv").fillna("")
    precautions = pd.read_csv(DATA_DIR / "symptom_precaution.csv").fillna("")
    descriptions["Disease"] = descriptions["Disease"].astype(str).str.strip()
    precautions["Disease"] = precautions["Disease"].astype(str).str.strip()
    precaution_columns = [c for c in precautions.columns if c.lower().startswith("precaution_")]
    precaution_map = precautions.set_index("Disease").to_dict(orient="index")
    description_map = descriptions.set_index("Disease")["Description"].to_dict()
    disease_info = {}
    for disease in label_encoder.classes_:
        row = precaution_map.get(disease, {})
        disease_info[disease] = {
            "description": str(description_map.get(disease, "")),
            "precautions": [str(row.get(c, "")).strip() for c in precaution_columns if str(row.get(c, "")).strip()],
        }
    Path("disease_info.json").write_text(json.dumps(disease_info, indent=2, ensure_ascii=False), encoding="utf-8")

    with Path("processed_data.pkl").open("wb") as handle:
        pickle.dump({"X": feature_matrix, "y": encoded_labels, "label_encoder": label_encoder,
                     "symptom_columns": all_symptoms}, handle)
    print(f"Processed {len(data)} cases, {len(all_symptoms)} symptoms, {len(label_encoder.classes_)} diseases.")


if __name__ == "__main__":
    main()
