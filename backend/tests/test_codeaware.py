import unittest
from pathlib import Path
import tempfile
import json
from fastapi.testclient import TestClient

from app.main import app
from app.ai.reasoner import CodeAwareReasoner
from app.ml.intent_classifier import IntentClassifier
from app.agents.orchestrator import CodeAwareOrchestrator
from app.agents.security_agent import SecurityAgent
from app.agents.bug_agent import BugAgent
from app.agents.impact_agent import ImpactAgent
from app.agents.fix_agent import FixAgent
from app.agents.test_agent import TestAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.code_review_agent import CodeReviewAgent
from app.agents.architecture_agent import ArchitectureAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.documentation_agent import DocumentationAgent
from app.agents.repository_agent import RepositoryAgent
from app.agents.search_agent import SearchAgent
from app.agents.rag_agent import RAGAgent
from app.agents.git_agent import GitAgent
from app.graph.code_knowledge_graph import CodeKnowledgeGraph
from app.graph.impact_analyzer import ImpactAnalyzer
from app.rag.chunker import CodeChunker
from app.rag.retriever import HybridRetriever
from app.services.rag_service import RAGService
from app.services.autonomous_workflow import AutonomousWorkflow
from app.analysis.ast_parser import PythonASTAnalyzer, GenericCodeAnalyzer
from app.analysis.code_analyzer import CodeAnalyzer
from app.analysis.repository_scanner import RepositoryScanner


class TestCodeAwareBackend(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_and_system_status_endpoints(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["components"]["reasoner"])

        res_sys = self.client.get("/system/status")
        self.assertEqual(res_sys.status_code, 200)
        sys_data = res_sys.json()
        self.assertEqual(sys_data["agents_count"], 15)
        self.assertTrue(sys_data["local_first"])

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

    def test_test_agent(self):
        agent = TestAgent()
        sample_fn = "def multiply(a: int, b: int) -> int:\n    return a * b\n"
        res = agent.run({"code": sample_fn, "file_path": "math_ops.py"})
        self.assertTrue(res["success"])
        test_code = res.get("raw_data", {}).get("generated_test_code", "")
        self.assertIn("class Test", test_code)
        self.assertIn("def test_multiply", test_code)

    def test_architecture_and_performance_agents(self):
        arch_agent = ArchitectureAgent()
        perf_agent = PerformanceAgent()
        
        sample_code = """
import time
def get_data():
    time.sleep(1)
    s = ""
    for i in range(100):
        s += str(i)
    return s
"""
        arch_res = arch_agent.run({"code": sample_code, "file_path": "service.py"})
        self.assertTrue(arch_res["success"])
        
        perf_res = perf_agent.run({"code": sample_code, "file_path": "service.py"})
        self.assertTrue(perf_res["success"])
        perf_types = [f["type"] for f in perf_res["findings"]]
        self.assertTrue(any("string_concatenation" in t or "blocking_sleep" in t for t in perf_types))

    def test_code_review_agent(self):
        review_agent = CodeReviewAgent()
        sample_code = "def add(a, b):\n    return a + b\n"
        res = review_agent.run({"code": sample_code, "file_path": "calc.py"})
        self.assertTrue(res["success"])
        self.assertGreaterEqual(res["raw_data"]["overall_score"], 70)
        self.assertEqual(len(res["raw_data"]["dimensions"]), 4)

    def test_ast_and_generic_analyzers(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            py_file = root / "app.py"
            py_file.write_text(
                "class AuthService:\n"
                "    def authenticate(self, user: str) -> bool:\n"
                "        return user == 'admin'\n"
            )
            js_file = root / "index.js"
            js_file.write_text("class UserView {}\nfunction renderApp() {}\n")

            py_analyzer = PythonASTAnalyzer(py_file)
            py_res = py_analyzer.analyze()
            self.assertEqual(len(py_res["classes"]), 1)
            self.assertEqual(py_res["classes"][0]["name"], "AuthService")

            js_analyzer = GenericCodeAnalyzer(js_file)
            js_res = js_analyzer.analyze()
            self.assertEqual(len(js_res["classes"]), 1)
            self.assertEqual(len(js_res["functions"]), 1)

            scanner = RepositoryScanner(root)
            scan_res = scanner.scan()
            self.assertEqual(scan_res["total_files"], 2)

            code_analyzer = CodeAnalyzer(root)
            code_res = code_analyzer.analyze()
            self.assertIn("AuthService", code_res["symbol_table"])

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

    def test_rag_service_and_reasoner(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            f1 = root / "auth_service.py"
            f1.write_text("def verify_jwt_token(token: str) -> bool:\n    \"\"\"Validate JWT Token string.\"\"\"\n    return len(token) > 10\n")

            rag = RAGService()
            index_res = rag.index_repository(str(root))
            self.assertEqual(index_res["status"], "ready")

            search_res = rag.search(str(root), "verify_jwt_token")
            self.assertGreaterEqual(search_res["count"], 1)

            ask_res = rag.ask(str(root), "How is JWT token validated?")
            self.assertTrue(ask_res["success"])
            self.assertIn("verify_jwt_token", ask_res["answer"])

    def test_autonomous_workflow_and_rollback(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            target = root / "calc.py"
            original_text = "def calc():\n    try:\n        pass\n    except:\n        pass\n"
            target.write_text(original_text)

            workflow = AutonomousWorkflow()
            run_res = workflow.run({
                "repository_path": str(root),
                "file_path": "calc.py",
                "problem": "Fix bare except"
            })
            self.assertTrue(run_res["success"])
            self.assertIn("--- a/", run_res["diff"])

            # Apply patch
            apply_res = workflow.approve_and_apply({
                "repository_path": str(root),
                "file_path": "calc.py",
                "patched_code": run_res["raw_data"]["patched_code"]
            })
            self.assertTrue(apply_res["success"])
            self.assertIn("except Exception as exc:", target.read_text())

    def test_orchestrator(self):
        orchestrator = CodeAwareOrchestrator()
        res = orchestrator.run("Find security vulnerabilities in auth")
        self.assertTrue(res["success"])
        self.assertEqual(res["intent"], "security_analysis")
        self.assertGreaterEqual(len(res["timeline"]), 3)
        self.assertEqual(res["timeline"][0]["step"], "Task Received")


if __name__ == "__main__":
    unittest.main()
