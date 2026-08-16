from app.ml.intent_classifier import (
    IntentClassifier
)


classifier = IntentClassifier()


questions = [

    "Where is authentication implemented?",

    "Why is my login failing?",

    "Generate tests for calculate_total",

    "Find SQL injection vulnerabilities",

    "What happens if I change verify_password?",

    "Explain the process_order function",

]


for question in questions:

    result = classifier.predict(
        question
    )

    print()
    print("=" * 60)
    print("QUESTION:")
    print(question)

    print()
    print("PREDICTION:")
    print(result)