import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        data = request.get_json()

        # Extract image and parameters from the request
        image_data = data.get('image')
        gaussian_blur = int(data.get('gaussianBlur', 7))
        canny_lower_threshold = int(data.get('cannyLowerThreshold', 30))
        canny_upper_threshold = int(data.get('cannyUpperThreshold', 100))

        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400

        # Decode the base64 image
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes))
        img = img.convert('RGB')
        img_np = np.array(img)

        # Convert RGB to BGR for OpenCV
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        # Apply Gaussian Blur
        if gaussian_blur % 2 == 0:
            gaussian_blur += 1  # Kernel size must be odd
        blurred = cv2.GaussianBlur(img_cv, (gaussian_blur, gaussian_blur), 0)

        # Apply Canny Edge Detection
        edges = cv2.Canny(blurred, canny_lower_threshold, canny_upper_threshold)

        # Convert edges to 3-channel image to display properly
        edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # Convert back to RGB for displaying
        processed_img_rgb = cv2.cvtColor(edges_colored, cv2.COLOR_BGR2RGB)
        processed_img_pil = Image.fromarray(processed_img_rgb)

        # Encode processed image to base64
        buffered = io.BytesIO()
        processed_img_pil.save(buffered, format="PNG")
        processed_img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        processed_image_data = f"data:image/png;base64,{processed_img_base64}"

        return jsonify({'processedImage': processed_image_data}), 200

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({'error': 'Failed to process image'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
