import os
from flask import Flask, render_template


def create_app():
    app = Flask(__name__)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app


app = create_app()


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").strip().lower() in ("1", "true", "yes", "on")
    app.run(debug=debug_mode)

