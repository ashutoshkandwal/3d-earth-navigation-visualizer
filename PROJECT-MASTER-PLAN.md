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

## 13. Website Deployment and Client Hosting Plan

- Current plan is to first deploy and test the visualizer on our own website/domain.
- GitHub will store and version-control the source code.
- Vercel will be used initially to build and host the React/Three.js web simulator.
- The main website will act as the front door, with either:
  - a launch button to the Vercel app, or
  - a subdomain such as `visualizer.ourdomain.com`.
- Initial deployment should be public or simple demo access only.
- Full authentication is not required in Phase 1.
- Future authentication should be planned but not implemented now.
- Authentication may later include:
  - password-protected demo access,
  - student/instructor login,
  - client organization login,
  - role-based access,
  - admin/instructor dashboard.
- Later, for client websites, preferred model is:
  - our GitHub + our Vercel + client subdomain/DNS link,
  - so we retain control of updates, fixes, and maintenance.
- Client-side requirement later:
  - create a subdomain such as `visualizer.clientdomain.com`,
  - add DNS CNAME record provided by Vercel,
  - add a website button/page linking to the simulator.
- Avoid asking clients for hosting passwords, cPanel access, FTP access, or server credentials unless absolutely necessary.
- Long-term business model can become hosted SaaS, where clients access the simulator through their own subdomain while we maintain the application.

### Immediate Action

- Keep current development focused on a working online MVP.
- Do not build full authentication yet.
- Keep code structure future-ready for auth by reserving folders or modules such as `src/auth`, `src/api`, and `src/modules`.
- Confirm the app builds successfully from `web-simulator`.
- Do not break the existing Latitude Teaching Mode or current React/Three.js simulator.

---

## Final Note

This is not just a project.

This is a:
**Full Navigation Training System**
