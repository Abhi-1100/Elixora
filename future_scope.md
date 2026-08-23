# Future Scope — MediGuide AI

## Current Implementation (Sem 5 SGP Scope)
- Rule-based/lookup-driven symptom guidance using a static disease-symptom dataset + LLM API for conversational responses
- OCR-based report parsing (Tesseract/PyMuPDF) matched against a reference-range CSV via fuzzy matching
- OCR + database lookup for medicine identification (no image classification model)
- Next.js frontend + Flask backend + PostgreSQL, JWT auth

This is intentionally scoped to be buildable in one semester without requiring large-scale model training infrastructure.

## Future Scope

### 1. Replace rule-based symptom checker with a trained ML classifier
Currently symptom matching can be lookup/keyword-based. Future work: train a proper supervised classifier (Random Forest / SVM / a fine-tuned small transformer) on the disease-symptom dataset so the system predicts probable conditions from free-text symptom descriptions, not just fixed checklists — including confidence scores per prediction.

### 2. Fine-tune a domain-specific language model
Instead of relying solely on a general-purpose LLM API, fine-tune a smaller open-source medical-domain model (e.g., BioBERT, ClinicalBERT, or a fine-tuned Llama/Mistral variant) on medical Q&A datasets, reducing API dependency/cost and improving domain accuracy for symptom explanations.

### 3. Image-based medicine recognition (CNN model)
Current medicine identification relies on OCR text extraction. Future scope: train a CNN-based image classifier (e.g., transfer learning on ResNet/EfficientNet) directly on medicine strip/pill images, so the system can identify medicines even when packaging text is worn, angled, or partially obscured — OCR-independent recognition.

### 4. Predictive health trend analysis
Extend the report analyzer to track a user's lab values over multiple report uploads over time, and use time-series analysis to flag concerning trends (e.g., gradually rising blood sugar across 3 reports) even when each individual reading is still "Normal."

### 5. Multilingual support
Extend the chatbot and report summaries to regional languages (Hindi, Gujarati, etc.) using multilingual NLP models, improving accessibility for non-English-speaking users — particularly relevant for a healthcare tool in an Indian context.

### 6. Integration with wearable devices
Future integration with fitness trackers/smartwatches (Google Fit, Apple Health APIs) to pull live vitals (heart rate, SpO2, sleep data) into the AI's context for more informed guidance.

### 7. Doctor/telemedicine handoff
Add a feature to connect users flagged with "Critical" report results or high-urgency chat symptoms directly to a telemedicine consultation flow, or generate a structured summary document a user can share with their actual doctor.

### 8. Mobile app
Port the Next.js frontend to a React Native/Flutter mobile app for on-the-go access, including camera-based direct capture for report/medicine scanning instead of file upload.

### 9. Explainable AI (XAI) for predictions
Add explainability (e.g., SHAP/LIME) to the ML classifier's predictions, so the system shows *why* it flagged a particular condition or lab value, improving user trust and making the tool viva-defensible on the "black box AI" concern examiners often raise.

### 10. Cloud deployment & scalability
Move from local Flask/Postgres setup to a scalable cloud deployment (AWS/GCP/Azure) with containerization (Docker), enabling multi-user production use beyond the academic demo.

---
*Include this section in your report's "Future Scope" or "Conclusion and Future Work" chapter, trimmed to the 3-5 points most relevant to your actual remaining timeline/interest.*
