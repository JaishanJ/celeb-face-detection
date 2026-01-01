# Flask Webcam Face Detection

A professional Flask web application for real-time face detection using webcam input or image uploads. The app detects faces, draws bounding boxes with names and confidence scores, and includes a smooth "detecting" animation while scanning. It supports multiple people and automatically tracks faces in real-time.

---

## Features

- **Webcam Detection**: Detect faces live using your webcam.
- **Image Upload Detection**: Upload an image to detect faces.
- **Real-Time Tracking**: Bounding boxes follow faces as they move.
- **Multi-Person Support**: Detect and track multiple faces simultaneously.
- **Professional UI**: Modern UI with animations and clear visual feedback.
- **Responsive Design**: Works on various screen sizes.

---

## Demo

- Real-time detection animation while scanning.
- Boxes appear with names and confidence when faces are detected.
- Automatically resumes detection if faces leave the frame.

---

## Installation

1. **Clone the repository:**
   git clone https://github.com/YOUR_USERNAME/flask-face-detection.git
   cd flask-face-detection

2. **Create a virtual environment (recommended)**
   py -m venv venv
   venv\Scripts\activate # Windows
   source venv/bin/activate # macOS/Linux

3. **Install dependencies**
   pip install flask

4. **Run the application**
   py app.py

5. **Open in browser**
   visit http://127.0.0.1:5000

--

## Usage

- Click **"Open Webcam"** to start live face detection.
- Use **"Close Webcam"** anytime to stop detection.
- Upload images to detect faces by clicking **"Upload Image"**.
- Detected faces are displayed with bounding boxes and confidence percentages.

## Technologies Used

- **Python 3**
- **Flask** (Web Framework)
- **HTML5 / CSS3 / JavaScript**
- **Canvas API** for drawing bounding boxes
- **WebRTC / getUserMedia API** for webcam access

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Contact

Created by **Jaishan Jethwa**.  
For questions or suggestions, feel free to contact me.
