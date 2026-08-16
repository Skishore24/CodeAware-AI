import ast
from pathlib import Path
from typing import Any, Dict, List


class PythonASTAnalyzer:
    """
    Analyzes Python source code using Python's built-in AST module.
    """

    def __init__(self, file_path: Path):
        self.file_path = Path(file_path)

    # ---------------------------------------------------------
    # Read source code
    # ---------------------------------------------------------

    def read_source(self) -> str:

        try:

            return self.file_path.read_text(
                encoding="utf-8",
                errors="ignore"
            )

        except Exception as exc:

            raise RuntimeError(
                f"Unable to read {self.file_path}: {exc}"
            ) from exc

    # ---------------------------------------------------------
    # Parse source code
    # ---------------------------------------------------------

    def parse(self):

        source = self.read_source()

        try:

            return ast.parse(
                source,
                filename=str(self.file_path)
            )

        except SyntaxError as exc:

            return {
                "syntax_error": True,
                "error": str(exc),
                "line": exc.lineno,
                "column": exc.offset,
            }

    # ---------------------------------------------------------
    # Get function parameters
    # ---------------------------------------------------------

    def get_parameters(
        self,
        node: ast.FunctionDef
    ) -> List[str]:

        parameters = []

        for argument in node.args.args:

            parameters.append(
                argument.arg
            )

        return parameters

    # ---------------------------------------------------------
    # Get function calls
    # ---------------------------------------------------------

    def get_calls(
        self,
        node: ast.AST
    ) -> List[str]:

        calls = []

        for child in ast.walk(node):

            if isinstance(child, ast.Call):

                function_name = self.get_node_name(
                    child.func
                )

                if function_name:

                    calls.append(function_name)

        return sorted(
            list(set(calls))
        )

    # ---------------------------------------------------------
    # Convert AST node to readable name
    # ---------------------------------------------------------

    def get_node_name(
        self,
        node: ast.AST
    ) -> str:

        if isinstance(node, ast.Name):

            return node.id

        if isinstance(node, ast.Attribute):

            parts = []

            current = node

            while isinstance(
                current,
                ast.Attribute
            ):

                parts.append(
                    current.attr
                )

                current = current.value

            if isinstance(
                current,
                ast.Name
            ):

                parts.append(
                    current.id
                )

            return ".".join(
                reversed(parts)
            )

        return ""

    # ---------------------------------------------------------
    # Get return statements
    # ---------------------------------------------------------

    def get_returns(
        self,
        node: ast.FunctionDef
    ) -> List[str]:

        returns = []

        for child in ast.walk(node):

            if isinstance(
                child,
                ast.Return
            ):

                if child.value is None:

                    returns.append("None")

                else:

                    value = self.get_node_name(
                        child.value
                    )

                    if value:

                        returns.append(value)

                    else:

                        returns.append(
                            ast.unparse(child.value)
                        )

        return returns

    # ---------------------------------------------------------
    # Analyze functions
    # ---------------------------------------------------------

    def analyze_function(
        self,
        node: ast.FunctionDef
    ) -> Dict[str, Any]:

        return {

            "name": node.name,

            "type": "function",

            "line": node.lineno,

            "end_line": getattr(
                node,
                "end_lineno",
                node.lineno
            ),

            "parameters": self.get_parameters(
                node
            ),

            "calls": self.get_calls(
                node
            ),

            "returns": self.get_returns(
                node
            ),

        }

    # ---------------------------------------------------------
    # Analyze async functions
    # ---------------------------------------------------------

    def analyze_async_function(
        self,
        node: ast.AsyncFunctionDef
    ) -> Dict[str, Any]:

        return {

            "name": node.name,

            "type": "async_function",

            "line": node.lineno,

            "end_line": getattr(
                node,
                "end_lineno",
                node.lineno
            ),

            "parameters": [
                argument.arg
                for argument in node.args.args
            ],

            "calls": self.get_calls(
                node
            ),

            "returns": self.get_returns(
                node
            ),

        }

    # ---------------------------------------------------------
    # Analyze class
    # ---------------------------------------------------------

    def analyze_class(
        self,
        node: ast.ClassDef
    ) -> Dict[str, Any]:

        methods = []

        for child in node.body:

            if isinstance(
                child,
                ast.FunctionDef
            ):

                methods.append(
                    self.analyze_function(
                        child
                    )
                )

            elif isinstance(
                child,
                ast.AsyncFunctionDef
            ):

                methods.append(
                    self.analyze_async_function(
                        child
                    )
                )

        return {

            "name": node.name,

            "type": "class",

            "line": node.lineno,

            "end_line": getattr(
                node,
                "end_lineno",
                node.lineno
            ),

            "bases": [
                self.get_node_name(base)
                for base in node.bases
            ],

            "methods": methods,

        }

    # ---------------------------------------------------------
    # Analyze imports
    # ---------------------------------------------------------

    def analyze_import(
        self,
        node: ast.Import
    ) -> List[str]:

        return [
            alias.name
            for alias in node.names
        ]

    # ---------------------------------------------------------
    # Analyze from imports
    # ---------------------------------------------------------

    def analyze_import_from(
        self,
        node: ast.ImportFrom
    ) -> Dict[str, Any]:

        return {

            "module": node.module,

            "names": [
                alias.name
                for alias in node.names
            ],

        }

    # ---------------------------------------------------------
    # Analyze complete file
    # ---------------------------------------------------------

    def analyze(self) -> Dict[str, Any]:

        tree = self.parse()

        # Syntax error
        if isinstance(tree, dict):

            return tree

        functions = []

        classes = []

        imports = []

        from_imports = []

        for node in ast.walk(tree):

            if isinstance(
                node,
                ast.FunctionDef
            ):

                functions.append(
                    self.analyze_function(
                        node
                    )
                )

            elif isinstance(
                node,
                ast.AsyncFunctionDef
            ):

                functions.append(
                    self.analyze_async_function(
                        node
                    )
                )

            elif isinstance(
                node,
                ast.ClassDef
            ):

                classes.append(
                    self.analyze_class(
                        node
                    )

                )

            elif isinstance(
                node,
                ast.Import
            ):

                imports.extend(
                    self.analyze_import(
                        node
                    )
                )

            elif isinstance(
                node,
                ast.ImportFrom
            ):

                from_imports.append(
                    self.analyze_import_from(
                        node
                    )
                )

        return {

            "file": str(
                self.file_path
            ),

            "language": "Python",

            "functions": functions,

            "classes": classes,

            "imports": imports,

            "from_imports": from_imports,

        }