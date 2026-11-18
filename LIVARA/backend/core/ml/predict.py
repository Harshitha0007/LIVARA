
from pathlib import Path
from functools import lru_cache

import joblib


ML_DIR = Path(__file__).resolve().parent

MODEL_PATH = ML_DIR / "complaint_model.joblib"

CONFIDENCE_THRESHOLD = 0.45


@lru_cache(maxsize=1)
def load_model():

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "AI model not found. Run train_model.py first."
        )

    return joblib.load(MODEL_PATH)


def predict_category(description):

    if not isinstance(description, str) or not description.strip():

        raise ValueError("Please enter a complaint description.")

    model = load_model()

    probabilities = model.predict_proba([description.strip()])[0]

    best_index = probabilities.argmax()

    suggested_category = str(model.classes_[best_index])

    confidence = float(probabilities[best_index])

    needs_manual_review = confidence < CONFIDENCE_THRESHOLD

    return {
        "category": (
            suggested_category
            if not needs_manual_review
            else None
        ),
        "suggested_category": suggested_category,
        "confidence": round(confidence, 4),
        "needs_manual_review": needs_manual_review
    }
