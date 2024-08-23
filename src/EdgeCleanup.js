import React, { useState } from 'react';
import { Form, Button, Row, Col, Image } from 'react-bootstrap';
import * as GeoTIFF from 'geotiff';
import 'bootstrap/dist/css/bootstrap.min.css';

const EdgeCleanup = () => {
    const [image, setImage] = useState(null);
    const [fileName, setFileName] = useState('');
    const [processedImage, setProcessedImage] = useState(null);
    const [gaussianBlur, setGaussianBlur] = useState(7);
    const [cannyLowerThreshold, setCannyLowerThreshold] = useState(30);
    const [cannyUpperThreshold, setCannyUpperThreshold] = useState(100);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'image/tiff' || file.type === 'image/x-tiff')) {
            setFileName(file.name);

            const tiff = await GeoTIFF.fromBlob(file);
            const image = await tiff.getImage();
            const width = image.getWidth();
            const height = image.getHeight();
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            const tiles = await image.readRGB({ window: [0, 0, width, height] });

            const imageData = context.createImageData(width, height);
            const rgba = new Uint8ClampedArray(4 * width * height);

            for (let i = 0; i < tiles.length; i += 3) {
                const r = tiles[i];
                const g = tiles[i + 1];
                const b = tiles[i + 2];

                const j = i / 3 * 4;
                rgba[j] = r;
                rgba[j + 1] = g;
                rgba[j + 2] = b;
                rgba[j + 3] = 255; // Alpha channel
            }

            imageData.data.set(rgba);
            context.putImageData(imageData, 0, 0);
            const dataURL = canvas.toDataURL();
            setImage(dataURL);
        } else {
            alert('Please select a valid TIFF file.');
        }
    };

    const processImage = async () => {
        try {
            const response = await fetch('http://localhost:5000/process-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: image,
                    gaussianBlur: gaussianBlur,
                    cannyLowerThreshold: cannyLowerThreshold,
                    cannyUpperThreshold: cannyUpperThreshold,
                }),
            });
    
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
    
            const data = await response.json();
            setProcessedImage(data.processedImage);
        } catch (error) {
            console.error('Error processing image:', error);
        }
    };
    
    

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">Edge Cleanup Tool</h1>
            <Row>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Select Image (TIFF)</Form.Label>
                        <Form.Control type="file" accept=".tif,.tiff" onChange={handleImageChange} />
                    </Form.Group>
                    {fileName && (
                        <div className="mt-2">
                            <h6>Selected File: {fileName}</h6>
                        </div>
                    )}
                    {image && (
                        <div className="mt-4">
                            <h5>Original Image:</h5>
                            <Image src={image} fluid />
                        </div>
                    )}
                </Col>
                <Col md={6}>
                    {processedImage && (
                        <div className="mt-4">
                            <h5>Processed Image:</h5>
                            <Image src={processedImage} fluid />
                        </div>
                    )}
                </Col>
            </Row>
            <Row className="mt-4">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Gaussian Blur: {gaussianBlur}</Form.Label>
                        <Form.Control
                            type="range"
                            min="1"
                            max="15"
                            value={gaussianBlur}
                            onChange={(e) => setGaussianBlur(e.target.value)}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Canny Lower Threshold: {cannyLowerThreshold}</Form.Label>
                        <Form.Control
                            type="range"
                            min="1"
                            max="100"
                            value={cannyLowerThreshold}
                            onChange={(e) => setCannyLowerThreshold(e.target.value)}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Canny Upper Threshold: {cannyUpperThreshold}</Form.Label>
                        <Form.Control
                            type="range"
                            min="50"
                            max="200"
                            value={cannyUpperThreshold}
                            onChange={(e) => setCannyUpperThreshold(e.target.value)}
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Button variant="primary" className="mt-3" onClick={processImage}>Process Image</Button>
            {processedImage && (
                <div className="mt-4">
                    <h5>Processing Details:</h5>
                    <ul>
                        <li>Gaussian Blur: {gaussianBlur}</li>
                        <li>Canny Lower Threshold: {cannyLowerThreshold}</li>
                        <li>Canny Upper Threshold: {cannyUpperThreshold}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EdgeCleanup;
