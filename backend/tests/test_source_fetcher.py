from app.integrations.source_fetcher import (
    ReadableHtmlParser,
    count_words,
    extract_examples,
    extract_questions,
)


def test_readable_html_parser_extracts_structure_and_media_counts() -> None:
    parser = ReadableHtmlParser()

    parser.feed(
        """
        <html>
          <head><title>Competitor Article</title><style>.x{}</style></head>
          <body>
            <script>alert('x')</script>
            <h1>Should you buy a Yamaha U3?</h1>
            <h2>Price and sound</h2>
            <h3>Warranty checklist</h3>
            <p>Ví dụ: người mới học cần kiểm tra âm thanh và độ bền.</p>
            <p>What should buyers check?</p>
            <table><tr><td>Model</td></tr></table>
            <img src="piano.jpg" alt="Piano">
            <video src="demo.mp4"></video>
          </body>
        </html>
        """
    )

    assert parser.title == "Competitor Article"
    assert [heading.level for heading in parser.headings] == ["h1", "h2", "h3"]
    assert parser.headings[0].text == "Should you buy a Yamaha U3?"
    assert parser.headings[2].text == "Warranty checklist"
    assert "alert" not in parser.readable_text
    assert parser.tables_count == 1
    assert parser.images_count == 1
    assert parser.videos_count == 1


def test_extraction_helpers_return_questions_examples_and_word_count() -> None:
    parser = ReadableHtmlParser()
    parser.feed(
        """
        <h1>Should you buy a Yamaha U3?</h1>
        <p>Ví dụ: hãy so sánh serial, âm thanh và bảo hành.</p>
        <p>What warranty matters?</p>
        """
    )

    questions = extract_questions(parser.headings, parser.readable_text)
    examples = extract_examples(parser.readable_text)

    assert "Should you buy a Yamaha U3?" in questions
    assert "What warranty matters?" in questions
    assert examples == ["Ví dụ: hãy so sánh serial, âm thanh và bảo hành."]
    assert count_words(parser.readable_text) > 8
