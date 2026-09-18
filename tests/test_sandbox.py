
import pytest
from app.core.exceptions import SecuritySandboxException
from app.sandbox.runner import SandboxRunner


def test_sandbox_path_validation(temp_workspace):
    runner = SandboxRunner(repository_root=temp_workspace)

    # Valid relative path inside repo
    valid_path = runner.validate_path("src/calculator.py")
    assert valid_path.exists()

    # Directory traversal attempt should raise SecuritySandboxException
    with pytest.raises(SecuritySandboxException):
        runner.validate_path("../../windows/system32")

    with pytest.raises(SecuritySandboxException):
        runner.validate_path("../../../etc/passwd")


def test_sandbox_backup_and_rollback(temp_workspace):
    runner = SandboxRunner(repository_root=temp_workspace)
    calc_file = temp_workspace / "src" / "calculator.py"
    original_content = calc_file.read_text()

    # 1. Create backup
    backup_path = runner.backup_file(calc_file)
    assert backup_path.exists()

    # 2. Modify original file
    calc_file.write_text("# Corrupted content\ndef broken(): pass\n")
    assert calc_file.read_text() != original_content

    # 3. Rollback from backup
    success = runner.rollback_file(calc_file, backup_path)
    assert success is True
    assert calc_file.read_text() == original_content


def test_sandbox_disallow_unsafe_commands(temp_workspace):
    runner = SandboxRunner(repository_root=temp_workspace)

    # Malicious command not in ALLOWED_COMMANDS
    with pytest.raises(SecuritySandboxException):
        runner.execute_command("format C:", cwd=temp_workspace)

    with pytest.raises(SecuritySandboxException):
        runner.execute_command("rm -rf /", cwd=temp_workspace)
