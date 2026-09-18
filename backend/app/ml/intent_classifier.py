import math
import os
import re
from typing import Dict, List, Tuple, Any, Optional

_USE_NATIVE = os.getenv("CODEAWARE_NATIVE_TFIDF", "true").lower() in ("1", "true", "yes")

_SKLEARN_AVAILABLE = False
if not _USE_NATIVE:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        _SKLEARN_AVAILABLE = True
    except (ImportError, OSError, Exception):
        _SKLEARN_AVAILABLE = False


class IntentClassifier:
    """
    Production-grade Intent Classifier for CodeAware AI.
    Combines TF-IDF vectorization, Logistic Regression, and rule-based heuristics
    to support 15 developer intents, multi-intent detection, and confidence scoring.
    """

    INTENTS = [
        "code_search",
        "code_explanation",
        "repository_analysis",
        "bug_analysis",
        "security_analysis",
        "impact_analysis",
        "test_generation",
        "fix_request",
        "documentation",
        "dependency_analysis",
        "architecture_analysis",
        "performance_analysis",
        "refactoring",
        "code_review",
        "git_analysis",
    ]

    KEYWORD_MAPPINGS = {
        "security_analysis": [
            "security", "vulnerability", "sql injection", "sqli", "xss", "cve", "secret", "token", "password", "auth bypass", "unsafe", "eval", "exec", "exploit", "sanitize"
        ],
        "bug_analysis": [
            "bug", "error", "exception", "crash", "fails", "failing", "broken", "issue", "traceback", "syntax error", "why does", "what is wrong"
        ],
        "fix_request": [
            "fix", "patch", "repair", "correct this", "solve", "resolve", "autofix", "propose fix"
        ],
        "impact_analysis": [
            "impact", "blast radius", "what will break", "callers", "callees", "dependents", "if i change", "affected by", "downstream"
        ],
        "test_generation": [
            "test", "tests", "unit test", "pytest", "test case", "mock", "coverage", "generate tests", "write tests"
        ],
        "architecture_analysis": [
            "architecture", "layer", "design", "structure", "coupling", "circular", "monolith", "microservice", "mvc", "overview"
        ],
        "code_review": [
            "review", "code review", "smell", "code quality", "lint", "best practices", "pr review"
        ],
        "dependency_analysis": [
            "dependency", "dependencies", "imports", "packages", "package.json", "requirements.txt", "modules"
        ],
        "performance_analysis": [
            "performance", "slow", "bottleneck", "latency", "n+1", "optimize", "memory leak", "cpu"
        ],
        "refactoring": [
            "refactor", "cleanup", "simplify", "modernize", "extract method", "rename"
        ],
        "documentation": [
            "document", "documentation", "docstring", "readme", "explain api", "docs"
        ],
        "code_search": [
            "where is", "find", "search", "locate", "which file", "how to find"
        ],
        "code_explanation": [
            "explain", "how does", "what does", "walkthrough", "understand"
        ],
        "git_analysis": [
            "git", "commit", "branch", "diff", "history", "author", "log"
        ],
        "repository_analysis": [
            "repository", "repo", "tech stack", "languages", "scan", "project overview"
        ],
    }

    def __init__(self):
        self.is_trained = False
        self.vectorizer = None
        self.model = None
        self.native_idf: Dict[str, float] = {}
        self.intent_centroids: Dict[str, Dict[str, float]] = {}

        if _SKLEARN_AVAILABLE:
            try:
                self.vectorizer = TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    token_pattern=r"(?u)\b[\w\-_/.]+\b"
                )
                self.model = LogisticRegression(max_iter=1000, C=1.0)
                self._train_initial_model()
            except Exception:
                self.is_trained = False

        if not self.is_trained:
            self._train_native_model()

    def _training_data(self) -> Tuple[List[str], List[str]]:
        data: List[Tuple[str, str]] = [
            # Code search
            ("Where is authentication implemented?", "code_search"),
            ("Where is the login function defined?", "code_search"),
            ("Find all database queries", "code_search"),
            ("Where is JWT validation performed?", "code_search"),
            ("Find every API endpoint", "code_search"),
            ("Find functions that call authenticate_user", "code_search"),
            ("Where is file upload handled?", "code_search"),
            ("Find all SQL statements", "code_search"),
            ("Which file contains the user model?", "code_search"),
            ("Locate the stripe payment webhook", "code_search"),

            # Code explanation
            ("Explain this function", "code_explanation"),
            ("Explain authenticate_user in auth.py", "code_explanation"),
            ("How does the token refresh mechanism work?", "code_explanation"),
            ("What does this class do?", "code_explanation"),
            ("Explain the repository ingestion pipeline", "code_explanation"),
            ("Walk me through how errors are caught in the worker", "code_explanation"),

            # Repository analysis
            ("Analyze this repository", "repository_analysis"),
            ("What is the project structure and tech stack?", "repository_analysis"),
            ("Show me the repository overview", "repository_analysis"),
            ("How many files and lines of code are in this project?", "repository_analysis"),
            ("What languages and frameworks are used here?", "repository_analysis"),

            # Impact analysis
            ("What will break if I change authenticate_user?", "impact_analysis"),
            ("What files and functions depend on UserService?", "impact_analysis"),
            ("Analyze the blast radius of modifying the database schema", "impact_analysis"),
            ("Show callers and callees of this method", "impact_analysis"),
            ("What downstream modules are affected if I remove this field?", "impact_analysis"),

            # Bug analysis
            ("Find bugs in this repository", "bug_analysis"),
            ("Why is the login failing?", "bug_analysis"),
            ("Why does this function throw a NullPointerException?", "bug_analysis"),
            ("Find the cause of this exception", "bug_analysis"),
            ("What is wrong with this SQL query logic?", "bug_analysis"),
            ("Inspect this file for syntax and runtime errors", "bug_analysis"),

            # Security analysis
            ("Find security vulnerabilities", "security_analysis"),
            ("Check this repository for SQL injection and XSS", "security_analysis"),
            ("Find hardcoded secrets and API keys", "security_analysis"),
            ("Are there unsafe eval or exec calls in the codebase?", "security_analysis"),
            ("Audit authentication security and password hashing", "security_analysis"),
            ("Run a security audit on all controllers", "security_analysis"),

            # Test generation
            ("Generate unit tests for authenticate_user", "test_generation"),
            ("Create pytest test cases for the auth service", "test_generation"),
            ("What tests are missing for this module?", "test_generation"),
            ("Write integration tests for the API routes", "test_generation"),
            ("Generate regression tests with mocks", "test_generation"),

            # Fix request
            ("Fix this bug in auth.py", "fix_request"),
            ("Fix the login error and generate a patch", "fix_request"),
            ("Automatically fix the syntax error", "fix_request"),
            ("Repair the failing test case", "fix_request"),
            ("Create a pull request patch to resolve this issue", "fix_request"),

            # Documentation
            ("Generate documentation for this module", "documentation"),
            ("Create API documentation in markdown", "documentation"),
            ("Generate docstrings for all functions in service.py", "documentation"),
            ("Write a README section explaining the architecture", "documentation"),

            # Dependency analysis
            ("Analyze project dependencies and imports", "dependency_analysis"),
            ("List all external third party packages", "dependency_analysis"),
            ("Check for outdated or unused dependencies", "dependency_analysis"),
            ("Show the import hierarchy of the backend", "dependency_analysis"),

            # Architecture analysis
            ("Analyze the architecture of this repository", "architecture_analysis"),
            ("Detect circular dependencies between layers", "architecture_analysis"),
            ("Show layer separation between controllers, services, and models", "architecture_analysis"),
            ("Identify architectural violations and high coupling", "architecture_analysis"),

            # Performance analysis
            ("Find performance bottlenecks in database queries", "performance_analysis"),
            ("Detect N+1 query problems in the ORM", "performance_analysis"),
            ("Check for memory leaks and heavy computations", "performance_analysis"),
            ("Optimize the slow endpoint response time", "performance_analysis"),

            # Refactoring
            ("Refactor this large function into smaller helpers", "refactoring"),
            ("Clean up code duplication in services", "refactoring"),
            ("Modernize legacy syntax to async/await", "refactoring"),
            ("Simplify this nested conditional block", "refactoring"),

            # Code review
            ("Perform a code review on this pull request", "code_review"),
            ("Review this file for code smells and best practices", "code_review"),
            ("Conduct a comprehensive quality and maintainability review", "code_review"),
            ("Check this code against engineering standards", "code_review"),

            # Git analysis
            ("Show recent git commits and changes", "git_analysis"),
            ("Analyze git history and branch changes", "git_analysis"),
            ("Compare diff between branches", "git_analysis"),
        ]

        texts = [item[0] for item in data]
        labels = [item[1] for item in data]
        return texts, labels

    def _train_initial_model(self):
        texts, labels = self._training_data()
        X = self.vectorizer.fit_transform(texts)
        self.model.fit(X, labels)
        self.is_trained = True

    def _train_native_model(self):
        texts, labels = self._training_data()
        n_docs = len(texts)
        df: Dict[str, int] = {}
        doc_term_counts: List[Dict[str, int]] = []

        for text in texts:
            words = re.findall(r"(?u)\b[\w\-_/.]+\b", text.lower())
            tokens = list(words)
            for i in range(len(words) - 1):
                tokens.append(f"{words[i]} {words[i+1]}")

            counts: Dict[str, int] = {}
            for t in tokens:
                counts[t] = counts.get(t, 0) + 1
            for t in counts:
                df[t] = df.get(t, 0) + 1
            doc_term_counts.append(counts)

        self.native_idf = {
            t: math.log((1 + n_docs) / (1 + count)) + 1.0
            for t, count in df.items()
        }

        self.intent_centroids = {intent: {} for intent in self.INTENTS}
        for label, counts in zip(labels, doc_term_counts):
            vec: Dict[str, float] = {t: c * self.native_idf[t] for t, c in counts.items()}
            norm = math.sqrt(sum(v * v for v in vec.values()))
            if norm > 0:
                for t, v in vec.items():
                    self.intent_centroids[label][t] = self.intent_centroids[label].get(t, 0.0) + (v / norm)

        for intent in self.INTENTS:
            c_vec = self.intent_centroids[intent]
            c_norm = math.sqrt(sum(v * v for v in c_vec.values()))
            if c_norm > 0:
                self.intent_centroids[intent] = {t: v / c_norm for t, v in c_vec.items()}

        self.is_trained = True

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Classify text and extract primary & secondary intents with confidence and keyword boost.
        """
        if not text or not text.strip():
            return {
                "intent": "code_search",
                "confidence": 0.5,
                "secondary_intent": None,
                "alternatives": [],
                "reasoning": "Defaulted to code_search for empty prompt."
            }

        cleaned = text.strip()
        lower_text = cleaned.lower()

        # Keyword Heuristics Scoring
        keyword_scores: Dict[str, float] = {intent: 0.0 for intent in self.INTENTS}
        for intent, kw_list in self.KEYWORD_MAPPINGS.items():
            for kw in kw_list:
                if kw in lower_text:
                    keyword_scores[intent] += 0.35

        # ML Model Scoring
        ml_scores: Dict[str, float] = {}
        if self.model is not None and self.vectorizer is not None and self.is_trained:
            try:
                X = self.vectorizer.transform([cleaned])
                probs = self.model.predict_proba(X)[0]
                classes = self.model.classes_
                for cls, prob in zip(classes, probs):
                    ml_scores[cls] = float(prob)
            except Exception:
                pass

        if not ml_scores and self.intent_centroids:
            words = re.findall(r"(?u)\b[\w\-_/.]+\b", lower_text)
            tokens = list(words)
            for i in range(len(words) - 1):
                tokens.append(f"{words[i]} {words[i+1]}")

            q_counts: Dict[str, int] = {}
            for t in tokens:
                q_counts[t] = q_counts.get(t, 0) + 1

            q_vec = {t: c * self.native_idf.get(t, 1.0) for t, c in q_counts.items() if t in self.native_idf}
            q_norm = math.sqrt(sum(v * v for v in q_vec.values()))
            if q_norm > 0:
                q_vec = {t: v / q_norm for t, v in q_vec.items()}
                raw_sims = {}
                for intent in self.INTENTS:
                    c_vec = self.intent_centroids.get(intent, {})
                    sim = sum(q_vec[t] * c_vec[t] for t in q_vec if t in c_vec)
                    raw_sims[intent] = max(0.0, sim)
                total = sum(raw_sims.values())
                if total > 0:
                    for intent in self.INTENTS:
                        ml_scores[intent] = raw_sims[intent] / total
                else:
                    for intent in self.INTENTS:
                        ml_scores[intent] = 1.0 / len(self.INTENTS)

        # Combine ML and Keyword Scores
        combined_scores: Dict[str, float] = {}
        for intent in self.INTENTS:
            ml_val = ml_scores.get(intent, 0.0)
            kw_val = keyword_scores.get(intent, 0.0)
            combined = (ml_val * 0.6) + (min(kw_val, 1.0) * 0.4)
            combined_scores[intent] = round(combined, 4)

        ranked = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        primary_intent, primary_score = ranked[0]
        
        # Determine secondary intent if distinct and significant
        secondary_intent = None
        if len(ranked) > 1 and ranked[1][1] > 0.25 and ranked[1][0] != primary_intent:
            secondary_intent = ranked[1][0]

        # Multi-intent special cases (e.g. "find bug and fix it")
        if any(w in lower_text for w in ["fix", "patch", "repair"]) and any(w in lower_text for w in ["bug", "error", "why", "crash", "fails"]):
            if "fix" in lower_text:
                primary_intent = "bug_analysis"
                secondary_intent = "fix_request"

        confidence = max(min(primary_score, 0.99), 0.55)

        return {
            "intent": primary_intent,
            "confidence": round(confidence, 2),
            "secondary_intent": secondary_intent,
            "alternatives": [
                {"intent": name, "confidence": round(score, 2)}
                for name, score in ranked[1:4]
            ],
            "reasoning": f"Identified as {primary_intent} with confidence {round(confidence*100)}%" + (f" (Secondary: {secondary_intent})" if secondary_intent else "")
        }