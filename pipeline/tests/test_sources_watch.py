import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sources_watch import STATE, diff  # noqa: E402


class Diff(unittest.TestCase):
    def test_no_change(self):
        self.assertEqual(diff({"a": {"v": 1}}, {"a": {"v": 1}}), [])

    def test_reports_changed_and_new_sources(self):
        out = diff({"a": {"v": 1}}, {"a": {"v": 2}, "b": {"status": "200"}})
        self.assertEqual(len(out), 2)
        self.assertIn("### a", out[0])

    def test_state_file_is_valid_json(self):
        self.assertIsInstance(json.loads(STATE.read_text(encoding="utf-8")), dict)


if __name__ == "__main__":
    unittest.main()
