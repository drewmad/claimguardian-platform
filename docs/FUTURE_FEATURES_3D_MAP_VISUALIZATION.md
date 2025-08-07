# Future Feature: 3D Geospatial Data Visualization

**Owner:** team-product
**Status:** backlog

This document outlines potential 3D visualization features to be implemented when the core map functionality is enhanced. These ideas are designed to make NOAA environmental data more intuitive, impactful, and useful for users navigating insurance claims.

The primary technologies for implementation would be **Three.js** and **React Three Fiber** integrated into the existing map component.

---

### 1. "Living" Weather Map: 3D Particle Flow

- **Concept:** Render thousands of animated particles that flow and swirl with real-time wind or ocean currents, making invisible forces visible.
- **Data Sources:**
  - NWS API: Real-time wind speed and direction.
  - CO-OPS API: Ocean current data.
- **User Impact:** Provides an intuitive grasp of a storm's scale and rotational power, which is more impactful than simple text labels.

---

### 2. Dynamic Ocean Surface: 3D Wave & Storm Surge Model

- **Concept:** Visualize the ocean as a dynamic 3D surface. Wave height data controls the choppiness of the 3D waves, and storm surge data raises the sea level along a 3D model of the coastline.
- **Data Sources:**
  - NDBC Buoy Data: Significant Wave Height, Wave Period.
  - CO-OPS API: Real-time water level data.
- **User Impact:** Offers a visceral, first-person understanding of flood and wave threats, providing powerful evidence for flood-related claims.

---

### 3. "Glass Block" Atmosphere: Volumetric Data Rendering

- **Concept:** Treat the atmosphere above Florida as a transparent 3D volume. Render clouds, rain, and pressure systems as semi-transparent, colored volumes within this block.
- **Data Sources:**
  - NWS API: Sea Level Pressure.
  - NEXRAD Radar Data (via AWS or other sources).
- **User Impact:** Gives users a "god-like," three-dimensional view of a storm's structure, clearly explaining the conditions they experienced.

---

### 4. Historical Storm "Ribbon"

- **Concept:** Render the track of a past hurricane as a 3D "ribbon." The ribbon's width, color, and height off the map can represent the storm's wind field, intensity, and pressure drop.
- **Data Sources:**
  - NCEI Storm Events Database.
- **User Impact:** Transforms a dry list of past storms into a tangible, 3D sculpture of risk, making the abstract concept of "risk" feel more real and immediate.
