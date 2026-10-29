"""Deterministic artifact checks; does not test or verify the proposed application."""
from pathlib import Path
import re
import pymupdf as fitz
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output/pdf/SwiftDrop_Design_Report_Corrected.pdf'
SOURCE = Path('/Users/umairhassan/Desktop/SwiftDrop_Design_Report (1).pdf')


def main():
    report = fitz.open(OUTPUT)
    original = fitz.open(SOURCE)
    assert len(report) == 41
    assert len(PdfReader(OUTPUT, strict=True).pages) == 41
    pages = [page.get_text() for page in report]
    combined = '\n'.join(pages)
    for index, text in enumerate(pages, 1):
        assert len(text.strip()) > 100, f'Empty page {index}'
        assert '\ufffd' not in text, f'Invalid glyph on page {index}'
        for word in report[index - 1].get_text('words'):
            x0, y0, x1, y1, *_ = word
            assert x0 >= 1 and y0 >= 1 and x1 <= report[index - 1].rect.width - 1 and y1 <= report[index - 1].rect.height - 1, (index, 'text outside page', word)
    for number in [9, 27, 31, 40]:
        assert original[number - 1].get_text() == pages[number - 1], f'Changed source text on page {number}'
        assert original[number - 1].get_pixmap().samples == report[number - 1].get_pixmap().samples, f'Changed source rendering on page {number}'
    figure_pages = [8, 9, 10, 11, 13, 17, 19, 21, 24, 25, 26, 27, 28, 29, 30, 38]
    for number, page in enumerate(figure_pages, 1):
        assert f'Figure {number}:' in pages[page - 1], f'Missing caption {number}'
    for index in [1, 2]:
        links = report[index].get_links()
        assert len(links) == 30
        for link in links:
            assert 0 <= link['page'] < 41
            label = report[index].get_textbox(fitz.Rect(link['from'])).strip()
            assert label and label.split()[-1].isdigit(), ('TOC label', index, label)
            assert int(label.split()[-1]) == link['page'] + 1, ('Wrong TOC target', label, link['page'])
    required = {
        7: ['Admin inherits', 'Replay failed webhook'],
        10: ['Navigate to address', 'recipient name', 'Photo optional'],
        12: ['404', '403', '409', 'optional', 'at least once'],
        14: ['idempotency_records', 'family_id', 'proof_object_key', 'eventId'],
        15: ['sorted ID order', 'attempt_count', '7 days'],
        17: ['Core SQL', 'S3', 'service JWT', '/assistant'],
        21: ['parcel.created +', 'parcel.status.*', 'seven total'],
        22: ['webhooks.retry.{30,60,120,240,480,960}.q', 'at-least-once'],
        23: ['public:', 'private:', 'duplicate email remains possible'],
        28: ['three delivery attempts', 'two re-attempts', 'outside scope'],
        29: ['courier_id', 'version = version + 1', 'COMMIT no-op', 'ROLLBACK'],
        30: ['31.5 minutes', 'next attempt = attempt + 1', 'THEN ack source', 'Fresh timestamp'],
        36: ['/api/v1/admin/webhook-deliveries/{id}/replay', 'assigned=false'],
        37: ['No application source', 'concurrency', 'possible duplicate'],
        41: ['plan-only D3', 'reconciled product contract', 'build_report.py', 'does not gate baseline booking/onboarding'],
    }
    for number, phrases in required.items():
        normal = re.sub(r'\s+', ' ', pages[number - 1])
        for phrase in phrases:
            assert phrase.lower() in normal.lower(), (number, 'Missing contract', phrase)
    for obsolete in ['published exactly once', 'exactly one notification', 'retries without extra code', 'Each diagram is a group of native Word shapes', 'Full test results and coverage reports are submitted separately']:
        assert obsolete.lower() not in combined.lower(), ('Stale claim', obsolete)
    assert sum([30, 60, 120, 240, 480, 960]) == 1890
    assert 1890 / 60 == 31.5
    print('PASS: 41 nonempty pages; valid PDF structure; 16 figure captions; 60 accurate TOC links; text within page bounds; required report contracts; stale claims absent; retry arithmetic; four original pages text- and pixel-identical.')


if __name__ == '__main__':
    main()
