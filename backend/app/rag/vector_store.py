import math
import os
import re
from typing import Dict, List, Optional, Set

# Standard English stop words (equivalent to scikit-learn's stop_words="english")
_STOP_WORDS: Set[str] = {
    "a", "about", "above", "across", "after", "afterwards", "again", "against", "all",
    "almost", "alone", "along", "already", "also", "although", "always", "am", "among",
    "amongst", "amoungst", "amount", "an", "and", "another", "any", "anyhow", "anyone",
    "anything", "anyway", "anywhere", "are", "around", "as", "at", "back", "be",
    "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand",
    "behind", "being", "below", "beside", "besides", "between", "beyond", "bill", "both",
    "bottom", "but", "by", "call", "can", "cannot", "cant", "co", "con", "could",
    "couldnt", "cry", "de", "describe", "detail", "do", "done", "down", "due", "during",
    "each", "eg", "eight", "either", "eleven", "else", "elsewhere", "empty", "enough",
    "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except",
    "few", "fifteen", "fifty", "fill", "find", "fire", "first", "five", "for", "former",
    "formerly", "forty", "found", "four", "from", "front", "full", "further", "get",
    "give", "go", "had", "has", "hasnt", "have", "he", "hence", "her", "here",
    "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself",
    "his", "how", "however", "hundred", "i", "ie", "if", "in", "inc", "indeed",
    "interest", "into", "is", "it", "its", "itself", "keep", "last", "latter",
    "latterly", "least", "less", "ltd", "made", "many", "may", "me", "meanwhile",
    "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much",
    "must", "my", "myself", "name", "namely", "neither", "never", "nevertheless",
    "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now",
    "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or",
    "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own",
    "part", "per", "perhaps", "please", "put", "rather", "re", "same", "see",
    "seem", "seemed", "seeming", "seems", "serious", "several", "she", "should",
    "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow",
    "someone", "something", "sometime", "sometimes", "somewhere", "still", "such",
    "system", "take", "ten", "than", "that", "the", "their", "them", "themselves",
    "then", "thence", "there", "thereafter", "thereby", "therefore", "therein",
    "thereupon", "these", "they", "thick", "thin", "third", "this", "those", "though",
    "three", "through", "throughout", "thru", "thus", "to", "together", "too", "top",
    "toward", "towards", "twelve", "twenty", "two", "un", "under", "until", "up",
    "upon", "us", "very", "via", "was", "we", "well", "were", "what", "whatever",
    "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby",
    "wherein", "whereupon", "wherever", "whether", "which", "while", "whither",
    "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within",
    "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves"
}

_USE_NATIVE = os.getenv("CODEAWARE_NATIVE_TFIDF", "true").lower() in ("1", "true", "yes")

_SKLEARN_AVAILABLE = False
if not _USE_NATIVE:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        _SKLEARN_AVAILABLE = True
    except (ImportError, OSError, Exception):
        _SKLEARN_AVAILABLE = False


class NativeTFIDF:
    """
    Lightweight, high-performance, pure-Python TF-IDF vectorizer and cosine similarity engine.
    Immune to DLL loading and Application Control policy blocks on Windows (e.g. Smart App Control).
    """

    def __init__(self):
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self.n_docs: int = 0

    def tokenize(self, text: str) -> List[str]:
        words = re.findall(r"(?u)\b[\w\-_/.]+\b", text.lower())
        return [w for w in words if w not in _STOP_WORDS and len(w) > 1]

    def fit_transform(self, texts: List[str]):
        self.n_docs = len(texts)
        if self.n_docs == 0:
            self.idf = {}
            self.doc_vectors = []
            return

        df: Dict[str, int] = {}
        doc_term_counts: List[Dict[str, int]] = []

        for text in texts:
            tokens = self.tokenize(text)
            term_counts: Dict[str, int] = {}
            for t in tokens:
                term_counts[t] = term_counts.get(t, 0) + 1
            for t in term_counts:
                df[t] = df.get(t, 0) + 1
            doc_term_counts.append(term_counts)

        # Smooth IDF: ln((1 + n) / (1 + df)) + 1
        self.idf = {
            t: math.log((1 + self.n_docs) / (1 + count)) + 1.0
            for t, count in df.items()
        }

        # Build normalized vectors
        self.doc_vectors = []
        for counts in doc_term_counts:
            vec: Dict[str, float] = {}
            for t, c in counts.items():
                vec[t] = c * self.idf[t]
            norm = math.sqrt(sum(v * v for v in vec.values()))
            if norm > 0:
                vec = {t: v / norm for t, v in vec.items()}
            self.doc_vectors.append(vec)

    def transform(self, text: str) -> Dict[str, float]:
        tokens = self.tokenize(text)
        term_counts: Dict[str, int] = {}
        for t in tokens:
            term_counts[t] = term_counts.get(t, 0) + 1

        vec: Dict[str, float] = {}
        for t, c in term_counts.items():
            if t in self.idf:
                vec[t] = c * self.idf[t]

        norm = math.sqrt(sum(v * v for v in vec.values()))
        if norm > 0:
            vec = {t: v / norm for t, v in vec.items()}
        return vec

    def search(self, query: str, top_k: int = 10) -> List[tuple]:
        query_vec = self.transform(query)
        if not query_vec:
            return []

        scored = []
        for idx, dvec in enumerate(self.doc_vectors):
            sim = sum(query_vec[t] * dvec[t] for t in query_vec if t in dvec)
            if sim > 0:
                scored.append((idx, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]


class TFIDFVectorStore:

    def __init__(self):
        self.documents: List[Dict] = []
        self.matrix = None
        self.native_engine: Optional[NativeTFIDF] = None
        self.vectorizer = None

        if _SKLEARN_AVAILABLE:
            try:
                self.vectorizer = TfidfVectorizer(
                    lowercase=True,
                    stop_words="english"
                )
            except Exception:
                self.vectorizer = None

        if self.vectorizer is None:
            self.native_engine = NativeTFIDF()

    def build(
        self,
        documents: List[Dict]
    ):
        self.documents = documents

        if not documents:
            self.matrix = None
            return

        texts = [
            document.get("content", "") or document.get("raw_code", "")
            for document in documents
        ]

        if self.vectorizer is not None:
            try:
                self.matrix = self.vectorizer.fit_transform(texts)
                return
            except Exception:
                self.vectorizer = None
                self.native_engine = NativeTFIDF()

        if self.native_engine is not None:
            self.native_engine.fit_transform(texts)
            self.matrix = True

    def search(
        self,
        query: str,
        top_k: int = 10
    ) -> List[Dict]:
        if not self.documents or self.matrix is None:
            return []

        if self.vectorizer is not None and self.matrix is not True:
            try:
                query_vector = self.vectorizer.transform([query])
                similarities = cosine_similarity(query_vector, self.matrix)[0]
                ranked_indices = similarities.argsort()[::-1]

                results = []
                for index in ranked_indices:
                    score = float(similarities[index])
                    if score <= 0:
                        continue
                    document = dict(self.documents[index])
                    document["vector_score"] = score
                    results.append(document)
                    if len(results) >= top_k:
                        break
                return results
            except Exception:
                pass

        if self.native_engine is not None:
            scored = self.native_engine.search(query, top_k=top_k)
            results = []
            for index, score in scored:
                document = dict(self.documents[index])
                document["vector_score"] = float(score)
                results.append(document)
            return results

        return []