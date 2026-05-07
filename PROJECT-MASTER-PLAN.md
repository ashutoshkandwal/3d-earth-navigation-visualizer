# Navigation Learning Simulator – Master Plan

## 1. Project Objective
Build a web-based interactive simulator for:
- Terrestrial Navigation
- Celestial Navigation

Use cases:
- Student self-learning
- Instructor teaching
- Classroom demonstration

---

## 2. Tech Stack

Frontend:
- React
- Three.js
- HTML / CSS

Future (Optional):
- FastAPI backend
- SQLite / JSON

---

## 3. System Architecture

web-simulator/
├── src/
│   ├── components/
│   ├── scene/
│   ├── utils/
│   ├── modules/
│   ├── data/
│   ├── styles/
│   └── App.jsx

---

## 4. Module Structure

### Phase 1: Foundation
- Earth sphere
- Rotation
- Zoom & pan
- Equator
- Prime meridian
- Latitudes / Longitudes
- Position plotting

### Phase 2: Terrestrial Navigation
- Compass & Direction
- Plane Sailing
- Mercator Sailing
- Great Circle

### Phase 3: Celestial Navigation
- Celestial Sphere
- Time & Hour Angle
- Sextant & Corrections
- PZX Triangle
- Polaris
- Sun Navigation
- Twilight & Stars

---

## 5. User Modes

### Student Mode
- Guided learning
- Step-by-step explanation
- Practice problems

### Instructor Mode
- Free control
- Demonstration tools

### Simulation Mode
- Real navigation scenarios

---

## 6. Design Principles

- Build ONE module at a time
- Never break working code
- Separate logic from UI
- Reusable math functions
- Keep visuals clean
- Performance over complexity

---

## 7. Development Workflow

For each module:
1. Define scope
2. Build minimal version
3. Test
4. Commit
5. Extend

---

## 8. Git Strategy

Branches:
- main → stable
- simulator-v2-react-web → development

Commit format:
- Module 01: Earth base
- Module 01.1: Controls
- Module 01.2: Equator

---

## 9. Strict Rules

- Do NOT build everything at once
- Do NOT mix modules early
- Do NOT overcomplicate UI
- Do NOT depend fully on AI tools

---

## 10. Current Status

✔ React setup complete  
✔ Three.js installed  
✔ 3D Earth rendering working  

---

## 11. Immediate Next Steps

Module 01.1:
- Mouse drag rotation
- Zoom

Module 01.2:
- Equator
- Prime meridian

---

## 12. Future Expansion

- AI assistant
- Voice explanation
- VR/AR version
- Integration with bridge simulator

---

## Final Note

This is not just a project.

This is a:
**Full Navigation Training System**