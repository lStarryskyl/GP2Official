"""Wrapper to run tests and save output to a file."""
import sys
import os

# Set encoding env before anything else
os.environ["PYTHONIOENCODING"] = "utf-8"

# Open output file
output_file = open(r'test_output.txt', 'w', encoding='utf-8')

# Save originals
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr

# Replace stdout/stderr BEFORE importing test module
# (test module also modifies stdout at import time, so we override after)
sys.stdout = output_file
sys.stderr = output_file

# Now import the test module - its stdout/stderr changes will use our file
# We need to bypass the module's own stdout wrapping
import importlib.util
spec = importlib.util.spec_from_file_location("test_mod", "test_all_endpoints.py")
test_mod = importlib.util.module_from_spec(spec)

# Override sys.stdout/stderr again before exec  
sys.stdout = output_file
sys.stderr = output_file

spec.loader.exec_module(test_mod)

# Override again after import (test module re-wraps stdout)
sys.stdout = output_file
sys.stderr = output_file

p, f = test_mod.run_all_tests()

output_file.flush()
output_file.close()

# Restore
sys.stdout = _orig_stdout
sys.stderr = _orig_stderr

print(f"Tests complete: {p} passed, {f} failed")
