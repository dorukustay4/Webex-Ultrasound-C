# Webex Ultrasound Annotator

A web application for creating Webex meetings, sharing HDMI feeds (ultrasound video streams), taking screenshots, and annotating them using the VGG Image Annotator (VIA) tool.

## Features

- **Webex Meeting Management**: Create and join Webex meetings
- **Multi-Window Video Interface**: 
  - Remote Doctor Webcam
  - Local Doctor & Patient Webcam  
  - Live HDMI Feed (ultrasound stream)
  - Annotation Area with VIA
- **Screenshot Capture**: Take screenshots from the HDMI feed
- **Image Annotation**: Embed VGG Image Annotator (VIA) for medical image annotation
- **Responsive Design**: Works on desktop and mobile devices

## Use Case

This application is designed for telemedicine scenarios where:
- A local doctor performs an ultrasound examination
- A remote specialist provides real-time consultation
- The ultrasound feed is shared via HDMI capture
- Screenshots can be taken and annotated for documentation
- Both doctors can collaborate on the same interface

## Setup

### Prerequisites
- Modern web browser with camera access
- Webex developer account (for production use)
- HDMI capture device (for ultrasound feed)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dorukustay4/Webex-Ultrasound-C.git
cd Webex-Ultrasound-C
```

2. Install dependencies:
```bash
npm install
```

3. Open `index.html` in your browser or serve it using a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

## Usage

1. **Create/Join Meeting**: Use the buttons to create a new Webex meeting or join an existing one
2. **Camera Setup**: The app will request camera permissions for the video windows
3. **HDMI Feed**: Connect your HDMI capture device (ultrasound machine) to display the feed
4. **Take Screenshots**: Click "Take Screenshot" to capture frames from the HDMI feed
5. **Annotate**: Use the embedded VIA tool to annotate captured screenshots

## Technical Details

### Video Streams
- Uses `getUserMedia` API for webcam access
- Supports multiple camera devices
- HDMI feed integration via capture card

### Screenshot Functionality
- Canvas-based screenshot capture
- PNG format output
- Automatic loading into VIA annotation tool

### VIA Integration
- Embedded VGG Image Annotator
- Loaded from official CDN
- Supports medical image annotation

## Development

### File Structure
```
├── index.html          # Main application interface
├── index.js            # Core application logic
├── style.css           # Styling and layout
├── app.js              # Additional application features
├── package.json        # Node.js dependencies
└── README.md           # This file
```

### Key Functions
- `setupWebcams()`: Initialize camera streams
- `setupHDMIFeed()`: Configure HDMI capture
- `takeScreenshot()`: Capture and process screenshots
- `embedVIA()`: Load VIA annotation tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- [VGG Image Annotator (VIA)](https://www.robots.ox.ac.uk/~vgg/software/via/) for annotation capabilities
- Webex for video conferencing infrastructure
