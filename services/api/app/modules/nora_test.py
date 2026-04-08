"""
NORA-TEST: Creates and runs tests.
Generates test plans and mock test results for generated code.
Phase 1: deterministic mock output.
"""
from typing import TypedDict


class TestResult(TypedDict):
    suite: str
    total: int
    passed: int
    failed: int
    status: str


def generate_test_plan(file_paths: list[str]) -> list[str]:
    """
    Generate a list of test file paths for the given source files.
    """
    test_files: list[str] = []
    for path in file_paths:
        if path.endswith(".py") and not path.endswith("_test.py"):
            test_files.append(path.replace(".py", "_test.py").replace("app/", "tests/"))
        elif path.endswith(".tsx") or path.endswith(".ts"):
            if "components" in path or "pages" in path:
                base = path.rsplit(".", 1)[0]
                test_files.append(f"{base}.test.tsx")
    return test_files


def run_tests(file_paths: list[str]) -> list[TestResult]:
    """
    Run mock tests for generated files. Phase 1: all pass.
    """
    results: list[TestResult] = []

    # Frontend suite
    frontend_files = [f for f in file_paths if f.endswith((".tsx", ".ts", ".jsx", ".js"))]
    if frontend_files:
        total = max(len(frontend_files) * 2, 4)
        results.append(TestResult(
            suite="Frontend (Jest/React Testing Library)",
            total=total,
            passed=total,
            failed=0,
            status="PASSED",
        ))

    # Backend suite
    backend_files = [f for f in file_paths if f.endswith(".py")]
    if backend_files:
        total = max(len(backend_files) * 2, 3)
        results.append(TestResult(
            suite="Backend (pytest)",
            total=total,
            passed=total,
            failed=0,
            status="PASSED",
        ))

    # Database suite
    db_files = [f for f in file_paths if f.endswith(".sql")]
    if db_files:
        results.append(TestResult(
            suite="Database migrations",
            total=len(db_files),
            passed=len(db_files),
            failed=0,
            status="PASSED",
        ))

    return results


def summarize_results(results: list[TestResult]) -> dict:
    total = sum(r["total"] for r in results)
    passed = sum(r["passed"] for r in results)
    failed = sum(r["failed"] for r in results)
    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "all_passed": failed == 0,
        "suites": [
            {"suite": r["suite"], "total": r["total"], "passed": r["passed"], "status": r["status"]}
            for r in results
        ],
    }
