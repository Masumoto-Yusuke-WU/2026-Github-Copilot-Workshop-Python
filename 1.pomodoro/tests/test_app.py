from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app


def test_index_returns_200():
    app = create_app()
    app.testing = True
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200


def test_index_renders_expected_ui_elements():
    app = create_app()
    app.testing = True
    client = app.test_client()

    response = client.get("/")
    html = response.get_data(as_text=True)

    assert "ポモドーロタイマー" in html
    assert 'id="timer-display"' in html
    assert 'id="btn-start"' in html
    assert 'id="btn-reset"' in html
    assert 'id="completed-count"' in html
    assert 'id="focus-time"' in html
    assert 'id="setting-work"' in html
    assert 'id="setting-short-break"' in html
    assert 'id="setting-long-break"' in html
    assert 'id="setting-interval"' in html
    assert 'id="btn-save-settings"' in html


def test_index_references_required_assets():
    app = create_app()
    app.testing = True
    client = app.test_client()

    response = client.get("/")
    html = response.get_data(as_text=True)

    assert "/static/css/style.css" in html
    assert "/static/js/timer-engine.js" in html
    assert "/static/js/session-policy.js" in html
    assert "/static/js/progress-service.js" in html
    assert "/static/js/repositories.js" in html
    assert "/static/js/notification-service.js" in html
    assert "/static/js/app.js" in html