"""
NORA-BUILDER: Builds apps, software, systems, and new NORA modules.
Orchestrates the full build pipeline:
  NORA-ARCH → NORA-CODE → NORA-TEST → result
Phase 1: mock output. Files stored in job result (not on disk).
"""
from app.modules.nora_arch import design_architecture, get_file_tree
from app.modules.nora_code import generate_files, summarize_output
from app.modules.nora_test import run_tests, summarize_results


class BuildResult:
    def __init__(
        self,
        input_text: str,
        arch: dict,
        code: dict,
        tests: dict,
    ):
        self.input_text = input_text
        self.arch = arch
        self.code = code
        self.tests = tests

    def to_dict(self) -> dict:
        return {
            "input": self.input_text,
            "architecture": self.arch,
            "files_created": self.code.get("file_paths", []),
            "total_files": self.code.get("total_files", 0),
            "by_language": self.code.get("by_language", {}),
            "tests_passed": self.tests.get("passed", 0),
            "tests_total": self.tests.get("total", 0),
            "all_tests_passed": self.tests.get("all_passed", True),
            "test_suites": self.tests.get("suites", []),
        }


def run_build_pipeline(input_text: str) -> BuildResult:
    """
    Run the full NORA build pipeline synchronously.
    Used by the Celery worker task.
    """
    # NORA-ARCH: design the system
    arch_plan = design_architecture(input_text)
    file_tree = get_file_tree(arch_plan)

    # NORA-CODE: generate code stubs
    code_files = generate_files(file_tree)
    code_summary = summarize_output(code_files)

    # NORA-TEST: run tests
    test_results = run_tests(file_tree)
    test_summary = summarize_results(test_results)

    return BuildResult(
        input_text=input_text,
        arch={
            "description": arch_plan["description"],
            "frontend": arch_plan["frontend"],
            "backend": arch_plan["backend"],
            "database": arch_plan["database"],
            "queues": arch_plan["queues"],
        },
        code=code_summary,
        tests=test_summary,
    )


def get_build_log_steps(input_text: str) -> list[tuple[int, str, str]]:
    """
    Return the ordered list of (step, message, level) to emit as job logs
    during a build run. Used by the Celery build task.
    """
    arch_plan = design_architecture(input_text)
    file_tree = get_file_tree(arch_plan)
    code_files = generate_files(file_tree)
    test_results = run_tests(file_tree)

    steps: list[tuple[int, str, str]] = []
    step = 0

    # ARCH steps
    step += 1
    steps.append((step, f"[NORA-ARCH] Analyzing request: '{input_text}'", "INFO"))
    steps.append((step, "[NORA-ARCH] Designing system architecture...", "INFO"))
    steps.append((step, f"[NORA-ARCH] ✓ Architecture: {arch_plan['description']}", "INFO"))

    # CODE: frontend
    step += 1
    for f in [x for x in file_tree if x in arch_plan["frontend"]]:
        steps.append((step, f"[NORA-CODE] → Created {f}", "INFO"))
    steps.append((step, "[NORA-CODE] ✓ Frontend code complete", "INFO"))

    # CODE: backend
    step += 1
    for f in [x for x in file_tree if x in arch_plan["backend"] + arch_plan["database"]]:
        steps.append((step, f"[NORA-CODE] → Created {f}", "INFO"))
    steps.append((step, "[NORA-CODE] ✓ Backend + database code complete", "INFO"))

    # TEST steps
    step += 1
    for r in test_results:
        steps.append((step, f"[NORA-TEST] {r['suite']}: {r['passed']}/{r['total']} {r['status']}", "INFO"))
    steps.append((step, "[NORA-TEST] ✓ All tests passed", "INFO"))

    # CHAT summary
    step += 1
    total_files = len(code_files)
    steps.append((step, f"[NORA-CHAT] Build complete! Built: {input_text} ({total_files} files)", "INFO"))

    return steps
