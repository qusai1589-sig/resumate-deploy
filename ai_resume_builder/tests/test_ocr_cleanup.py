import importlib.util
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('ocr_cleanup_test_module', Path(__file__).resolve().parents[1] / 'ocr_engine.py')
ocr = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {'paddleocr': types.SimpleNamespace(PaddleOCR=lambda **kwargs: None)}):
    spec.loader.exec_module(ocr)


class PDFCleanupTests(unittest.TestCase):
    def test_pdf_page_temporary_files_are_removed_after_success_or_ocr_error(self):
        for failure in (False, True):
            directory = Path(tempfile.mkdtemp(prefix='resume-test-pdf-'))
            page = directory / 'page-1.png'; page.write_bytes(b'test')
            with patch.object(ocr, 'pdf_to_images', return_value=[str(page)]), patch.object(ocr, 'run_ocr_on_image', side_effect=RuntimeError('OCR failed') if failure else None, return_value=[{'text': 'Test candidate'}]):
                if failure:
                    with self.assertRaises(RuntimeError):
                        ocr.run_ocr('fixture.pdf')
                else:
                    self.assertEqual(ocr.run_ocr('fixture.pdf')[0]['page'], 1)
            self.assertFalse(directory.exists())

    def test_conversion_failure_removes_scratch_directory(self):
        directory = Path(tempfile.mkdtemp(prefix='resume-test-convert-'))
        with patch.object(ocr.tempfile, 'mkdtemp', return_value=str(directory)), patch.object(ocr.subprocess, 'run', side_effect=RuntimeError('Conversion failed')):
            with self.assertRaises(RuntimeError):
                ocr.pdf_to_images('fixture.pdf')
        self.assertFalse(directory.exists())

if __name__ == '__main__':
    unittest.main()
