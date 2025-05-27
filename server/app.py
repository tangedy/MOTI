from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = "placeholder"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


@app.route("/api/paraphrase", methods=["POST"])
def paraphrase():
    data = request.get_json()
    goal = data.get("goal", "").strip()
    if goal == '':
        return "<h1>u didnt submit anything!!</h1>"
    




if __name__ == "__main__":
    app.run(debug=True)
