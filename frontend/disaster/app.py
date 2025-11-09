from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)


@app.route('/map', methods = ['GET'])
def map():
    directory = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(directory, 'locations.json')
    with open(filepath) as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/areas', methods=['GET'])
def areas():
    directory = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(directory, 'regions.json')
    with open(filepath) as f:
        data = json.load(f)
    return jsonify(data)

@app.route("/disasters", methods=["GET"])
def get_disasters():
    import requests
    from datetime import datetime, timezone

    url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7"
    try:
        res = requests.get(url)
        res.raise_for_status()
        data = res.json()

        major_categories = {
            "Wildfires", "Severe Storms", "Volcanoes", "Earthquakes", "Floods"
        }

        events = []
        for ev in data.get("events", []):
            categories = {c["title"] for c in ev.get("categories", [])}
            if not categories & major_categories:
                continue
            if not ev.get("geometry"):
                continue

            latest = ev["geometry"][-1]
            coords = latest.get("coordinates")
            if not coords or len(coords) < 2:
                continue

            events.append({
                "id": ev["id"],
                "title": ev["title"],
                "category": list(categories & major_categories)[0],
                "latitude": coords[1],
                "longitude": coords[0],
                "link": ev.get("link"),
                "date": latest.get("date"),  # ⬅️ include timestamp
            })

        print(f"✅ Sending {len(events)} filtered EONET events")
        return jsonify(events)
    except Exception as e:
        print("Error fetching EONET:", e)
        return jsonify({"error": "Could not fetch EONET data"}), 500




if __name__ == '__main__':
    app.run(debug = True, port=5040)