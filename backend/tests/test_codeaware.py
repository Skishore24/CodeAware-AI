import unittest
from pathlib import Path
import tempfile

from app.ai.reasoner import CodeAwareReasoner
from app.ml.intent_classifier import IntentClassifier
from app.agents.orchestrator import CodeAwareOrchestrator
from app.agents.security_agent import SecurityAgent
from app.agents.bug_agent import BugAgent
from app.agents.impact_agent import ImpactAgent
from app.agents.fix_agent import FixAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.code_review_agent import CodeReviewAgent
from app.graph.code_knowledge_graph import CodeKnowledgeGraph
from app.graph.impact_analyzer import ImpactAnalyzer
from app.rag.chunker import CodeChunker
from app.rag.retriever import HybridRetriever
from app.services.rag_service import RAGService


class TestCodeAwareBackend(unittest.TestCase):

    def test_intent_classifier(self):
        classifier = IntentClassifier()
        res1 = classifier.predict("Where is authentication implemented?")
        self.assertEqual(res1["intent"], "code_search")
        self.assertGreater(res1["confidence"], 0.5)

        res2 = classifier.predict("Find security vulnerabilities and SQL injection")
        self.assertEqual(res2["intent"], "security_analysis")

        res3 = classifier.predict("Why is the login function failing with an error?")
        self.assertEqual(res3["intent"], "bug_analysis")

        res4 = classifier.predict("What will break if I modify authenticate_user?")
        self.assertEqual(res4["intent"], "impact_analysis")

        res5 = classifier.predict("Find the bug and fix it")
        self.assertEqual(res5["intent"], "bug_analysis")
        self.assertEqual(res5.get("secondary_intent"), "fix_request")

    def test_security_agent(self):
        agent = SecurityAgent()
        vulnerable_code = """
def login(user, password):
    api_key = "secret_1234567890"
    query = f"SELECT * FROM users WHERE username = '{user}'"
    eval("print(user)")
    return query
"""
        res = agent.run({"code": vulnerable_code, "file_path": "auth.py"})
        self.assertTrue(res["success"])
        self.assertGreaterEqual(len(res["findings"]), 3)
        types = [f["type"] for f in res["findings"]]
        self.assertIn("hardcoded_secret", types)
        self.assertIn("sql_injection", types)
        self.assertIn("dangerous_eval", types)

    def test_bug_agent(self):
        agent = BugAgent()
        code_with_bugs = """
def calculate():
    try:
        x = 1 / 0
    except:
        pass
    # FIXME: handle division properly
"""
        res = agent.run({"code": code_with_bugs, "file_path": "calc.py"})
        self.assertTrue(res["success"])
        self.assertGreaterEqual(len(res["findings"]), 2)
        types = [f["type"] for f in res["findings"]]
        self.assertIn("bare_except", types)
        self.assertIn("fixme_marker", types)

    def test_fix_agent_and_diff(self):
        agent = FixAgent()
        code = """
def process():
    try:
        do_something()
    except:
        pass
"""
        res = agent.run({"code": code, "problem": "Fix bare except"})
        self.assertTrue(res["success"])
        raw = res.get("raw_data", {})
        self.assertIn("except Exception as exc:", raw.get("patched_code", ""))
        self.assertIn("--- a/", raw.get("diff", ""))
        self.assertIn("+++ b/", raw.get("diff", ""))

    def test_validation_agent(self):
        agent = ValidationAgent()
        valid_code = "def add(a, b):\n    return a + b\n"
        res1 = agent.run({"modified_code": valid_code, "file_path": "math_util.py", "run_tests": False})
        self.assertTrue(res1["success"])

        invalid_syntax = "def add(a, b\n    return a + b"
        res2 = agent.run({"modified_code": invalid_syntax, "file_path": "bad.py", "run_tests": False})
        self.assertFalse(res2["success"])
        self.assertIn("Syntax error", res2["summary"])

    def test_knowledge_graph_and_impact(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            service_file = root / "service.py"
            service_file.write_text("def authenticate_user(user, pw):\n    return True\n")
            
            api_file = root / "routes.py"
            api_file.write_text("from service import authenticate_user\ndef login_route():\n    return authenticate_user('a', 'b')\n")

            kg = CodeKnowledgeGraph()
            summary = kg.build(str(root))
            self.assertGreaterEqual(summary["total_nodes"], 2)
            
            export_data = kg.export()
            self.assertGreaterEqual(len(export_data["nodes"]), 2)

            analyzer = ImpactAnalyzer(kg)
            impact = analyzer.analyze("authenticate_user")
            self.assertTrue(impact["success"])
            self.assertEqual(impact["symbol"], "authenticate_user")

    def test_orchestrator(self):
        orchestrator = CodeAwareOrchestrator()
        res = orchestrator.run("Find security vulnerabilities in auth")
        self.assertTrue(res["success"])
        self.assertEqual(res["intent"], "security_analysis")
        self.assertGreaterEqual(len(res["timeline"]), 3)
        self.assertEqual(res["timeline"][0]["step"], "Task Received")


if __name__ == "__main__":
    unittest.main()
