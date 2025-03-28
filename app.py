from flask import Flask, request, jsonify, render_template
import base64
from PIL import Image
from io import BytesIO
import requests
from openai import OpenAI
import os

app = Flask(__name__)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

NAVER_CLIENT_ID = "v9ly50ixv9"
NAVER_CLIENT_SECRET = "KhqJ2drhM4EzpmTtCzTHqk6SrVeWmlIWek3XO47m"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze-image", methods=["POST"])
def analyze_image():
    try:
        data = request.files.get("image")
        if not data:
            return jsonify({"error": "No image uploaded"}), 400

        image = Image.open(data)
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "이 이미지를 분석해서 어떤 텍스트가 적혀 있는지 추출해줘. 답변은 단답형으로 텍스트만 알려줘줘"},
                        {"type": "image_url", "image_url": {
                            "url": f"data:image/png;base64,{img_base64}"
                        }}
                    ]
                }
            ],
            max_tokens=500
        )

        result_text = response.choices[0].message.content.strip()
        keyword = result_text.split("\n")[0]
        geo_data = get_coordinates_from_keyword(keyword)

        return jsonify({
            "result": result_text,
            "geo": geo_data
        })

    except Exception as e:
        print("[ERROR]", e)
        return jsonify({"error": str(e)}), 500


@app.route("/get-coordinates")
def get_coordinates():
    query = request.args.get("query", "")
    return jsonify(get_coordinates_from_keyword(query))

def get_coordinates_from_keyword(keyword):
    url = "https://naveropenapi.apigw.ntruss.com/map-place/v1/search?query=노들섬"
    headers = {
        "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET
    }
    params = {"query": keyword}

    res = requests.get(url, headers=headers, params=params)
    data = res.json()

    print("[DEBUG] 네이버 응답:", data)  # 여기에 이걸 추가하세요


    if data.get('addresses'):
        addr = data['addresses'][0]
        return {
            "lat": float(addr['y']),
            "lng": float(addr['x']),
            "roadAddress": addr.get('roadAddress', keyword)
        }
    return None

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
