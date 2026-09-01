"""Train and evaluate Random Forest and Bernoulli Naive Bayes classifiers."""
from pathlib import Path
import pickle
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import BernoulliNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


def evaluate(name, model, X_test, y_test):
    """Print standard test metrics and return weighted F1."""
    predictions = model.predict(X_test)
    report = classification_report(y_test, predictions, output_dict=True, zero_division=0)
    print(f"{name}: accuracy={accuracy_score(y_test, predictions):.4f}, "
          f"precision={report['weighted avg']['precision']:.4f}, "
          f"recall={report['weighted avg']['recall']:.4f}, "
          f"F1={report['weighted avg']['f1-score']:.4f}")
    return report["weighted avg"]["f1-score"]


def main() -> None:
    """Load processed data, train models, evaluate, and save the winner."""
    with Path("processed_data.pkl").open("rb") as handle:
        payload = pickle.load(handle)
    X, y = payload["X"], np.asarray(payload["y"])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    rf = RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1, class_weight="balanced")
    nb = BernoulliNB()
    rf.fit(X_train, y_train)
    nb.fit(X_train, y_train)
    print("Test metrics (weighted averages):")
    rf_f1 = evaluate("Random Forest", rf, X_test, y_test)
    nb_f1 = evaluate("BernoulliNB", nb, X_test, y_test)
    print("\nTop 15 Random Forest features:")
    for index in np.argsort(rf.feature_importances_)[::-1][:15]:
        print(f"  {payload['symptom_columns'][index]}: {rf.feature_importances_[index]:.6f}")
    winner = rf if rf_f1 >= nb_f1 else nb
    joblib.dump(winner, "model.pkl")
    with Path("model_metadata.pkl").open("wb") as handle:
        pickle.dump({"label_encoder": payload["label_encoder"],
                     "symptom_columns": payload["symptom_columns"]}, handle)
    print(f"\nSaved model.pkl ({'Random Forest' if winner is rf else 'BernoulliNB'}).")


if __name__ == "__main__":
    main()
