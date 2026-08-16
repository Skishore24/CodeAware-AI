from typing import Dict, List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


class IntentClassifier:
    """
    Classifies developer questions into CodeAware intents.

    This is the first ML-based decision component
    used by the CodeAware Orchestrator.
    """

    INTENTS = [
        "code_search",
        "code_explanation",
        "repository_analysis",
        "impact_analysis",
        "bug_analysis",
        "security_analysis",
        "test_generation",
        "fix_request",
        "documentation",
    ]

    def __init__(self):

        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
        )

        self.model = LogisticRegression(
            max_iter=1000
        )

        self.is_trained = False

        self._train_initial_model()

    # ---------------------------------------------------------
    # Initial training data
    # ---------------------------------------------------------

    def _training_data(
        self
    ) -> Tuple[List[str], List[str]]:

        examples = [

            # ---------------------------------------------
            # Code search
            # ---------------------------------------------

            "Where is authentication implemented?",
            "Where is the login function?",
            "Find the payment implementation",
            "Which file contains the user service?",
            "Find the function that handles login",
            "Where is database connection created?",

            # ---------------------------------------------
            # Code explanation
            # ---------------------------------------------

            "Explain this function",
            "Explain authenticate_user",
            "How does this function work?",
            "What does this class do?",
            "Explain this code",
            "Explain the login implementation",

            # ---------------------------------------------
            # Repository analysis
            # ---------------------------------------------

            "Analyze this repository",
            "Analyze the project structure",
            "Show me the repository structure",
            "What technologies does this project use?",
            "How many files are in this repository?",
            "What programming languages are used?",

            # ---------------------------------------------
            # Impact analysis
            # ---------------------------------------------

            "What will break if I change this function?",
            "What files depend on authenticate_user?",
            "What is affected by changing login?",
            "Show dependencies of this function",
            "What calls this function?",
            "Analyze the impact of this change",

            # ---------------------------------------------
            # Bug analysis
            # ---------------------------------------------

            "Find bugs in this repository",
            "Why is the login failing?",
            "Why does this function crash?",
            "Find the cause of this error",
            "Analyze this exception",
            "What is wrong with this code?",

            # ---------------------------------------------
            # Security
            # ---------------------------------------------

            "Find security vulnerabilities",
            "Check this repository for SQL injection",
            "Find hardcoded secrets",
            "Analyze security problems",
            "Check authentication security",
            "Find insecure code",

            # ---------------------------------------------
            # Test generation
            # ---------------------------------------------

            "Generate tests for this function",
            "Create unit tests",
            "What tests are missing?",
            "Generate test cases",
            "Write tests for login",
            "Create regression tests",

            # ---------------------------------------------
            # Fix request
            # ---------------------------------------------

            "Fix this bug",
            "Fix the login error",
            "Generate a fix",
            "Create a patch",
            "How can I fix this problem?",
            "Automatically fix this code",

            # ---------------------------------------------
            # Documentation
            # ---------------------------------------------

            "Generate documentation",
            "Create API documentation",
            "Explain the project documentation",
            "Generate README",
            "Document this function",
            "Update the project documentation",
        ]

        labels = (

            ["code_search"] * 6

            + ["code_explanation"] * 6

            + ["repository_analysis"] * 6

            + ["impact_analysis"] * 6

            + ["bug_analysis"] * 6

            + ["security_analysis"] * 6

            + ["test_generation"] * 6

            + ["fix_request"] * 6

            + ["documentation"] * 6

        )

        return examples, labels

    # ---------------------------------------------------------
    # Train
    # ---------------------------------------------------------

    def _train_initial_model(self):

        texts, labels = (
            self._training_data()
        )

        X = self.vectorizer.fit_transform(
            texts
        )

        self.model.fit(
            X,
            labels
        )

        self.is_trained = True

    # ---------------------------------------------------------
    # Predict
    # ---------------------------------------------------------

    def predict(
        self,
        text: str
    ) -> Dict:

        if not self.is_trained:

            raise RuntimeError(
                "Intent classifier is not trained."
            )

        X = self.vectorizer.transform(
            [text]
        )

        probabilities = (
            self.model.predict_proba(X)[0]
        )

        classes = self.model.classes_

        ranked = sorted(
            zip(
                classes,
                probabilities
            ),
            key=lambda item: item[1],
            reverse=True
        )

        intent = ranked[0][0]

        confidence = float(
            ranked[0][1]
        )

        return {

            "intent": intent,

            "confidence": confidence,

            "alternatives": [
                {
                    "intent": name,
                    "confidence": float(
                        probability
                    ),
                }
                for name, probability
                in ranked[:3]
            ],

        }