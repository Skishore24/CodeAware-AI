from typing import Any, Dict, Optional

from app.agents.fix_agent import FixAgent
from app.agents.test_agent import TestAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.git_agent import GitAgent
from app.agents.pr_agent import PRAgent


class AutonomousWorkflow:
    """
    Main autonomous software-engineering workflow.

    Flow:

        Request
           ↓
        Fix Agent
           ↓
        Test Agent
           ↓
        Validation Agent
           ↓
        Retry if validation fails
           ↓
        Human approval
           ↓
        Git Agent
           ↓
        PR Agent

    IMPORTANT:
    This service never creates a GitHub PR without
    explicit human approval.
    """

    name = "Autonomous Workflow"

    def __init__(self):

        self.fix_agent = FixAgent()
        self.test_agent = TestAgent()
        self.validation_agent = ValidationAgent()
        self.git_agent = GitAgent()
        self.pr_agent = PRAgent()

    # =========================================================
    # MAIN WORKFLOW
    # =========================================================

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        max_retries = input_data.get(
            "max_retries",
            2
        )

        if max_retries < 0:
            max_retries = 0

        # -----------------------------------------------------
        # Required information
        # -----------------------------------------------------

        repository_path = input_data.get(
            "repository_path"
        )

        file_path = input_data.get(
            "file_path"
        )

        problem = input_data.get(
            "problem"
        )

        if not repository_path:

            return self._error(
                "repository_path is required."
            )

        if not file_path:

            return self._error(
                "file_path is required."
            )

        if not problem:

            return self._error(
                "problem is required."
            )

        # -----------------------------------------------------
        # Workflow state
        # -----------------------------------------------------

        attempts = []

        current_problem = problem

        current_code = input_data.get(
            "original_code"
        )

        # -----------------------------------------------------
        # Retry loop
        # -----------------------------------------------------

        for attempt_number in range(
            1,
            max_retries + 2
        ):

            attempt = {
                "attempt": attempt_number
            }

            # =================================================
            # STEP 1 — FIX
            # =================================================

            fix_input = {
                **input_data,
                "repository_path": repository_path,
                "file_path": file_path,
                "problem": current_problem
            }

            if current_code is not None:

                fix_input[
                    "original_code"
                ] = current_code

            fix_result = self.fix_agent.run(
                fix_input
            )

            attempt["fix"] = fix_result

            # -------------------------------------------------
            # No fix generated
            # -------------------------------------------------

            if not fix_result.get(
                "changed",
                False
            ):

                attempts.append(
                    attempt
                )

                return {
                    "success": True,
                    "status": "FIX_NOT_GENERATED",
                    "workflow": self.name,
                    "attempts": attempts,
                    "message": (
                        "The Fix Agent could not "
                        "generate a safe automatic fix."
                    )
                }

            modified_code = (
                fix_result.get(
                    "modified_code"
                )
            )

            # =================================================
            # STEP 2 — GENERATE TEST
            # =================================================

            test_input = {
                "code": modified_code,
                "file_path": file_path,
                "function_name": input_data.get(
                    "function_name"
                ),
                "run_tests": False
            }

            test_result = self.test_agent.run(
                test_input
            )

            attempt["tests"] = test_result

            # -------------------------------------------------
            # Extract generated test
            # -------------------------------------------------

            test_code = (
                self._extract_test_code(
                    test_result
                )
            )

            # =================================================
            # STEP 3 — VALIDATE
            # =================================================

            validation_input = {
                "original_code": (
                    fix_result.get(
                        "original_code"
                    )
                ),
                "modified_code": modified_code,
                "file_path": file_path,
                "test_code": test_code,
                "run_tests": bool(
                    test_code
                )
            }

            validation_result = (
                self.validation_agent.run(
                    validation_input
                )
            )

            attempt["validation"] = (
                validation_result
            )

            # =================================================
            # VALIDATION PASSED
            # =================================================

            if validation_result.get(
                "validated",
                False
            ):

                attempts.append(
                    attempt
                )

                return {
                    "success": True,
                    "status": "VALIDATED",
                    "workflow": self.name,
                    "attempts": attempts,
                    "fix": fix_result,
                    "tests": test_result,
                    "validation": validation_result,
                    "requires_human_approval": True,
                    "message": (
                        "Fix passed validation. "
                        "Human approval is required "
                        "before Git operations."
                    )
                }

            # =================================================
            # VALIDATION FAILED
            # =================================================

            attempts.append(
                attempt
            )

            # -------------------------------------------------
            # No more retries
            # -------------------------------------------------

            if attempt_number > max_retries:

                return {
                    "success": True,
                    "status": "VALIDATION_FAILED",
                    "workflow": self.name,
                    "attempts": attempts,
                    "requires_human_approval": False,
                    "message": (
                        "Maximum fix attempts reached "
                        "without successful validation."
                    )
                }

            # -------------------------------------------------
            # Prepare next attempt
            # -------------------------------------------------

            current_problem = (
                self._build_retry_problem(
                    current_problem,
                    validation_result
                )
            )

            current_code = modified_code

        return {
            "success": False,
            "status": "UNKNOWN",
            "workflow": self.name,
            "attempts": attempts
        }

    # =========================================================
    # APPROVE FIX
    # =========================================================

    def approve(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        approved = input_data.get(
            "approved",
            False
        )

        if not approved:

            return {
                "success": False,
                "status": "WAITING_FOR_APPROVAL",
                "message": (
                    "Human approval is required."
                )
            }

        # -----------------------------------------------------
        # Git information
        # -----------------------------------------------------

        git_input = {
            **input_data,
            "create_branch": input_data.get(
                "create_branch",
                True
            ),
            "push": input_data.get(
                "push",
                False
            )
        }

        git_result = self.git_agent.run(
            git_input
        )

        if not git_result.get(
            "success",
            False
        ):

            return {
                "success": False,
                "status": "GIT_FAILED",
                "git": git_result
            }

        return {
            "success": True,
            "status": "GIT_COMPLETED",
            "git": git_result,
            "message": (
                "Validated fix was approved "
                "and Git operations completed."
            )
        }

    # =========================================================
    # CREATE PR
    # =========================================================

    def create_pr(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        approved = input_data.get(
            "approved",
            False
        )

        if not approved:

            return {
                "success": False,
                "status": "WAITING_FOR_APPROVAL",
                "message": (
                    "Human approval is required "
                    "before creating a pull request."
                )
            }

        pr_input = {
            **input_data,
            "approved": True
        }

        result = self.pr_agent.run(
            pr_input
        )

        return result

    # =========================================================
    # EXTRACT TEST CODE
    # =========================================================

    def _extract_test_code(
        self,
        test_result: Dict[str, Any]
    ) -> Optional[str]:

        tests = test_result.get(
            "tests",
            []
        )

        if not isinstance(
            tests,
            list
        ):

            return None

        pieces = []

        for test in tests:

            if not isinstance(
                test,
                dict
            ):
                continue

            pytest_code = test.get(
                "pytest_code"
            )

            if pytest_code:

                pieces.append(
                    pytest_code
                )

        if not pieces:

            return None

        return "\n\n".join(
            pieces
        )

    # =========================================================
    # RETRY PROBLEM
    # =========================================================

    def _build_retry_problem(
        self,
        original_problem: str,
        validation_result: Dict[str, Any]
    ) -> str:

        tests = validation_result.get(
            "tests",
            {}
        )

        stdout = ""

        stderr = ""

        if isinstance(
            tests,
            dict
        ):

            stdout = tests.get(
                "stdout",
                ""
            )

            stderr = tests.get(
                "stderr",
                ""
            )

        return (
            f"{original_problem}\n\n"
            "Previous fix failed validation.\n\n"
            "Validation output:\n"
            f"{stdout}\n"
            f"{stderr}\n\n"
            "Generate a safer corrected fix."
        )

    # =========================================================
    # ERROR
    # =========================================================

    def _error(
        self,
        message: str
    ) -> Dict[str, Any]:

        return {
            "success": False,
            "status": "INVALID_INPUT",
            "workflow": self.name,
            "error": message
        }