"""Singleton-backed symptom/disease model inference service."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import json
import pickle


class SymptomPredictor:
    """Loads all model artifacts once and provides validated predictions."""

    def __init__(self, model_dir: str | Path):
        model_dir = Path(model_dir)
        # Prefer the artifacts produced by the root-level pipeline. Keep support
        # for the legacy ml_models files so existing deployments remain usable.
        root_dir = Path(__file__).resolve().parents[3]
        if (root_dir / "model.pkl").exists() and (root_dir / "model_metadata.pkl").exists():
            self.model = joblib.load(root_dir / "model.pkl")
            with (root_dir / "model_metadata.pkl").open("rb") as handle:
                metadata = pickle.load(handle)
            self.label_encoder = metadata["label_encoder"]
            self.known_symptoms = tuple(str(value) for value in metadata["symptom_columns"])
            info_path = root_dir / "disease_info.json"
            self.disease_info = json.loads(info_path.read_text(encoding="utf-8")) if info_path.exists() else {}
            self.binarizer = None
        else:
            self.model = joblib.load(model_dir / "symptom_disease_model.pkl")
            self.binarizer = joblib.load(model_dir / "symptom_binarizer.pkl")
            self.label_encoder = joblib.load(model_dir / "disease_label_encoder.pkl")
            self.known_symptoms = tuple(str(value) for value in self.binarizer.classes_)
            self.disease_info = {}
        self._known_normalized = {self._normalize(symptom): symptom for symptom in self.known_symptoms}

    @staticmethod
    def _normalize(symptom: str) -> str:
        return " ".join(str(symptom).lower().replace("_", " ").split())

    def normalize_known_symptom(self, symptom: str) -> str | None:
        return self._known_normalized.get(self._normalize(symptom))

    def predict_disease(self, symptom_list: list[str], top_n: int = 3) -> dict[str, Any]:
        recognized: list[str] = []
        unrecognized: list[str] = []
        seen: set[str] = set()
        for symptom in symptom_list:
            canonical = self.normalize_known_symptom(symptom)
            if canonical is None:
                unrecognized.append(str(symptom))
            elif canonical not in seen:
                recognized.append(canonical)
                seen.add(canonical)
        if not recognized:
            return {"predictions": [], "recognized_symptoms": [], "unrecognized_symptoms": unrecognized}
        if self.binarizer is not None:
            vector = self.binarizer.transform([recognized])
        else:
            # New pipeline stores a plain symptom-column list instead of a
            # MultiLabelBinarizer; construct the same one-hot order explicitly.
            vector = np.zeros((1, len(self.known_symptoms)), dtype=np.int8)
            index = {symptom: i for i, symptom in enumerate(self.known_symptoms)}
            for symptom in recognized:
                vector[0, index[symptom]] = 1
        probabilities = self.model.predict_proba(vector)[0]
        top_indices = np.argsort(probabilities)[::-1][: max(1, top_n)]
        predictions = [
            {"disease": str(self.label_encoder.classes_[index]),
             "confidence": round(float(probabilities[index]), 3),
             "description": self.disease_info.get(str(self.label_encoder.classes_[index]), {}).get("description", ""),
             "precautions": self.disease_info.get(str(self.label_encoder.classes_[index]), {}).get("precautions", [])}
            for index in top_indices
        ]
        return {"predictions": predictions, "recognized_symptoms": recognized, "unrecognized_symptoms": unrecognized}


def init_symptom_predictor(app) -> None:
    """Load artifacts during app creation, rather than on every request."""
    model_dir = Path(app.root_path) / "ml_models"
    # The current training pipeline writes model.pkl/model_metadata.pkl at the
    # repository root. Check those artifacts before requiring the legacy
    # backend/app/ml_models layout.
    root_dir = Path(__file__).resolve().parents[3]
    root_artifacts_available = (
        (root_dir / "model.pkl").exists()
        and (root_dir / "model_metadata.pkl").exists()
    )
    required = [model_dir / filename for filename in (
        "symptom_disease_model.pkl", "symptom_binarizer.pkl", "disease_label_encoder.pkl"
    )]
    missing = [path.name for path in required if not path.exists()]
    if missing and not root_artifacts_available:
        app.logger.warning("Symptom predictor unavailable; missing: %s", ", ".join(missing))
        app.extensions["symptom_predictor"] = None
        return
    app.extensions["symptom_predictor"] = SymptomPredictor(model_dir)
    app.logger.info("Loaded symptom disease model once at application startup.")


def get_symptom_predictor(app):
    return app.extensions.get("symptom_predictor")
