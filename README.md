# Neurotate

**Medical Ultrasound Annotation Platform for Regional Anesthesia Training**

A desktop application for annotating ultrasound images in medical education and research, specifically designed for ultrasound-guided regional anesthesia (UGRA) procedures.

![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Electron](https://img.shields.io/badge/Electron-Desktop%20App-purple)

## ✨ Features

- 🖼️ **Medical Image Annotation** - Polygon-based annotation with specialized medical attributes
- 📊 **Session Management** - Organize and track annotation sessions
- 🔍 **Library & Search** - Browse and filter past sessions
- 📤 **Data Export** - JSON exports for ML/AI research pipelines
- 🔒 **Privacy-First** - Local SQLite storage, no cloud dependency
- ⚡ **Offline Operation** - Fully functional without internet

## 🏛️ Academic Project

**Developer**: Doruk Ustay, MSc Computer Science  
**Supervisor**: Prof Dean Mohamedally  
**Institution**: University College London  
**Collaborators**: Intel Corp, Cisco  
**Publisher**: MotionInput Games Ltd  

*Developed through UCL's Industry Exchange Network (IXN) programme*

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/dorukustay4/Webex-Ultrasound-C.git
cd Webex-Ultrasound-C
npm install

# Run application
npm start
```

## 🎯 Medical Attributes

Captures specialized data for each annotation:
- Nerve types (Brachial Plexus, Femoral, Sciatic, etc.)
- Patient positioning and demographics
- Ultrasound visibility quality
- Needle approach techniques
- Clinical observations

## 🛠️ Technology

- **Frontend**: HTML5, CSS3, JavaScript
- **Framework**: Electron (cross-platform desktop)
- **Database**: SQLite (local storage)
- **Annotation Engine**: VGG Image Annotator integration

## 📤 Export Format

Generates research-ready JSON with flattened annotation-image pairs:
```json
{
  "sessionInfo": { "title": "Training Session", "category": "UGRA" },
  "annotations": [{
    "annotationType": "polygon",
    "nerveType": "Brachial Plexus",
    "imageData": "base64-encoded-image",
    "annotationPoints": [{"x": 100, "y": 200}]
  }]
}
```

## ⌨️ Keyboard Shortcuts

- **Ctrl+S** - Save annotation and move onto next image
- **Enter** - Complete polygon
- **Ctrl+Z/Ctrl+Y** - Undo/Redo
- **F1** - Help
- **Space** End Session

## 🙏 Acknowledgments

- **VGG Image Annotator** (University of Oxford) - BSD-2-Clause License
- **UCL Industry Exchange Network** - Academic-industry collaboration
- **Intel Corp & Cisco** - Industry partnership and support

## 📄 License

MIT License - See LICENSE file for details

---

*University College London © 2025+ - Advancing medical education through innovative annotation technology*
