
import csv
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


ML_DIR = Path(__file__).resolve().parent

DATASET_PATH = ML_DIR / "complaints.csv"
MODEL_PATH = ML_DIR / "complaint_model.joblib"

VALID_CATEGORIES = {
    "food",
    "shelter",
    "human_medical",
    "animal_rescue",
    "road_safety"
}


def load_dataset():
    descriptions = []
    categories = []

    if not DATASET_PATH.exists():
        raise FileNotFoundError("complaints.csv was not found.")

    with DATASET_PATH.open(
        "r", encoding="utf-8-sig", newline=""
    ) as file:

        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("CSV file is empty.")

        if "description" not in reader.fieldnames or "category" not in reader.fieldnames:
            raise ValueError(
                "CSV must contain description and category columns."
            )

        for row in reader:
            description = (row.get("description") or "").strip()
            category = (row.get("category") or "").strip().lower()

            # Match the existing Django category value
            if category == "medical":
                category = "human_medical"

            if description and category:
                descriptions.append(description)
                categories.append(category)

    unknown = set(categories) - VALID_CATEGORIES

    if unknown:
        raise ValueError(f"Unknown categories found: {unknown}")

    if len(descriptions) < 10:
        raise ValueError("Not enough training examples.")

    if len(set(categories)) != 5:
        raise ValueError("The dataset must contain all five categories.")

    return descriptions, categories


def train_model():

    print("\nLIVARA AI Complaint Classification")
    print("----------------------------------")

    descriptions, categories = load_dataset()

    print("Total examples:", len(descriptions))
    print("Categories:", sorted(set(categories)))

    x_train, x_test, y_train, y_test = train_test_split(
        descriptions,
        categories,
        test_size=0.20,
        random_state=42,
        stratify=categories
    )

    model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                stop_words="english",
                ngram_range=(1, 2)
            )
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced"
            )
        )
    ])

    model.fit(x_train, y_train)

    predictions = model.predict(x_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\nTraining completed successfully!")
    print(f"Test accuracy: {accuracy:.2%}")

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    joblib.dump(model, MODEL_PATH)

    print("\nModel saved successfully!")
    print(MODEL_PATH)


if __name__ == "__main__":

    try:
        train_model()

    except Exception as error:
        print("\nERROR:", error)
