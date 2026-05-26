"""Developer sandbox service."""

import asyncio
import subprocess
import tempfile
import sys
from pathlib import Path
from typing import Dict, Tuple
from concurrent.futures import ThreadPoolExecutor

from fastapi import HTTPException, status

from models.sandbox import SandboxRunRequest, SandboxRunResponse

# Thread pool for running subprocesses
_executor = ThreadPoolExecutor(max_workers=4)


def _run_subprocess(runner: Tuple[str, ...], script_path: str, input_text: str = None, timeout: int = 10):
    """Run subprocess synchronously (for thread pool execution)."""
    try:
        result = subprocess.run(
            [*runner, script_path],
            input=input_text.encode("utf-8") if input_text else None,
            capture_output=True,
            timeout=timeout,
        )
        return result.stdout, result.stderr, result.returncode, None
    except subprocess.TimeoutExpired:
        return b"", b"", -1, "timeout"
    except FileNotFoundError:
        return b"", b"", -1, "not_found"
    except Exception as e:
        return b"", str(e).encode("utf-8"), -1, "error"


class SandboxService:
    """Executes short-lived scripts in isolated subprocesses."""

    SUPPORTED: Dict[str, Tuple[str, ...]] = {
        "python": (sys.executable, "-u"),
        "py": (sys.executable, "-u"),
        "javascript": ("node",),
        "node": ("node",),
        "typescript": ("npx", "ts-node"),
        "ts": ("npx", "ts-node"),
    }

    async def run(self, payload: SandboxRunRequest) -> SandboxRunResponse:
        """Execute code for supported runtimes."""
        normalized = payload.language.strip().lower()
        if normalized not in self.SUPPORTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Runtime '{payload.language}' not supported yet",
            )

        runner = self.SUPPORTED[normalized]
        suffix = ".py" if "python" in normalized or normalized == "py" else ".js"
        
        with tempfile.NamedTemporaryFile("w+", suffix=suffix, delete=False) as tmp:
            tmp.write(payload.code)
            tmp.flush()
            script_path = Path(tmp.name)

        try:
            # Run in thread pool to avoid asyncio subprocess issues on Windows
            loop = asyncio.get_event_loop()
            stdout, stderr, returncode, error = await loop.run_in_executor(
                _executor,
                _run_subprocess,
                runner,
                str(script_path),
                payload.input_text,
                10
            )
            
            if error == "timeout":
                raise HTTPException(
                    status_code=status.HTTP_408_REQUEST_TIMEOUT,
                    detail="Sandbox execution timed out after 10s",
                )
            elif error == "not_found":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Runtime '{runner[0]}' is not installed on the server",
                )
            
            return SandboxRunResponse(
                language=normalized,
                stdout=stdout.decode("utf-8", errors="ignore"),
                stderr=stderr.decode("utf-8", errors="ignore"),
                exit_code=returncode,
                duration_ms=0,  # filled by router
            )
        finally:
            try:
                script_path.unlink(missing_ok=True)
            except OSError:
                pass
