from flask import Flask, render_template, request, redirect, url_for, jsonify
import boto3
import os
import base64

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "static/uploads"
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


# Initialize AWS Rekognition client
rekognition = boto3.client('rekognition')

@app.route("/detect-webcam", methods=["POST"])
def detect_webcam():
    image_data = request.form["webcam_frame"].split(",")[1]
    image_bytes = base64.b64decode(image_data)

    response = rekognition.recognize_celebrities(
        Image={"Bytes": image_bytes}
    )

    faces = []
    for celeb in response["CelebrityFaces"]:
        faces.append({
            "name": celeb["Name"],
            "confidence": round(celeb["MatchConfidence"], 1),
            "bounding_box": celeb["Face"]["BoundingBox"]
        })

    return jsonify({"faces": faces})

@app.route("/", methods=["GET", "POST"])
def index():
    for file in os.listdir(app.config["UPLOAD_FOLDER"]):
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], file)
        if os.path.isfile(file_path):
            os.remove(file_path)
    results = []
    filename = None

    if request.method == "POST":
        # Handle uploaded image
        if "image" in request.files:
            file = request.files["image"]
            if file.filename != "":
                filename = file.filename
                filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(filepath)

                with open(filepath, "rb") as image_file:
                    image_bytes = image_file.read()

                results = recognize_celebs(image_bytes)

    return render_template("index.html", results=results, filename=filename)

@app.route("/detect-image", methods=["POST"])
def detect_image():
    if "image" not in request.files:
        return jsonify({"faces": []})

    file = request.files["image"]
    image_bytes = file.read()

    response = rekognition.recognize_celebrities(Image={'Bytes': image_bytes})
    faces = []

    for celeb in response['CelebrityFaces']:
        faces.append({
            "name": celeb['Name'],
            "confidence": round(celeb['MatchConfidence'], 1),
            "bounding_box": celeb["Face"]["BoundingBox"]
        })
    return jsonify({"faces": faces})


def recognize_celebs(image_bytes):
    response = rekognition.recognize_celebrities(Image={'Bytes': image_bytes})
    results = []

    for celeb in response['CelebrityFaces']:
        box = celeb["Face"]["BoundingBox"]

        results.append({
            "name": celeb["Name"],
            "confidence": round(celeb["MatchConfidence"], 2),
            "top": box["Top"] * 100,
            "left": box["Left"] * 100,
            "width": box["Width"] * 100,
            "height": box["Height"] * 100,
        })

    return results

if __name__ == "__main__":
    app.run(debug=True)
