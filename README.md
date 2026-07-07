# Slice Rush: Fruit Frenzy 🎋
An action-packed, sensory-rich HTML5 canvas fruit-slicing mobile arcade game built with React, Vite, Tailwind CSS, and `motion/react`.

---

## 🎮 Game Architecture & Design Decisions

### 1. High Performance 2D Physics Loop (60 FPS)
To achieve flawless 60 FPS performance across mobile devices (Android & iOS) and browser sandboxes, the game is powered by a high-efficiency HTML5 `<canvas>` rendering context. React is used strictly for state navigation, menus, and shop overlays, while real-time calculations (such as motion tracking, gravity, and particle simulations) operate within a custom, non-blocking render loop.

### 2. Mathematically Flawless Swipe Intersection Checks
Many casual games register slices only on mouse/finger coordinate hover, which often fails during fast, realistic slashes. `Slice Rush` implements a segment-to-circle collision algorithm:
* The swipe trail is modeled as continuous segments $[P_{t-1}, P_t]$.
* We calculate the closest point $P_{\text{proj}}$ on the line segment to the circle's center $C$.
* If the distance $\|C - P_{\text{proj}}\|$ is less than or equal to the fruit's radius $r$, a successful slice is triggered.
This ensures 100% accurate, fluid slicing responsiveness at any drag speed.

### 3. Web Audio API Synth Engine
To avoid heavy static asset downloads, latency, or 404 network failure states, the game utilizes the browser's native **Web Audio API** to procedurally synthesize rich retro-sound effects in real-time. Sound effects include:
* **Swipe Wind:** Resonated high-pass white noise sweeps.
* **Fruit Splat:** Complex triangle-wave pitch envelopes combined with crisp high-pass noise cracks.
* **Bomb Explosion:** Low-frequency sine wave sub-rumble blended with decaying low-pass noise.
* **Combo Bells:** Rising major arpeggio notes.
* **Chiptune & Sci-Fi Packs:** Customized sound waveforms mapped to unlockable retro and laser packs.
* **Procedural Music Loop:** Soft background music chord arpeggiations synthesized dynamically.

### 4. Splitting & Spin Motion Physics
When a slice is made, the fruit splits into two perfect halves. To look natural and professional, the split forces are applied perpendicular to the player's slice vector. The pieces fly apart with custom angular spin, falling under gravity while their opacity fades out, creating an authentic, satisfying visual crunch.

---

## 📁 Project Folder Structure

```
/
├── index.html                 # Main entry web document & viewport configuration
├── metadata.json              # Applet metadata, descriptive name & permissions
├── package.json               # Declared dependencies and NPM build scripts
├── README.md                  # Complete architecture guide & installation steps
├── tsconfig.json              # TypeScript compilation rules
├── vite.config.ts             # Vite server bundling configuration
├── src/
│   ├── main.tsx               # Primary React entry point
│   ├── index.css              # Global styles, tailwind directives, custom fonts
│   ├── App.tsx                # Game state coordinator & layout shell
│   ├── types.ts               # Shared interfaces, configs, and physics structures
│   ├── lib/
│   │   ├── audio.ts           # Real-time Web Audio synthesizer
│   │   └── storage.ts         # Save manager, achievements, and shop configs
│   └── components/
│       ├── MainMenu.tsx       # Vibrant home page, settings, & tutorials
│       ├── GameCanvas.tsx     # 2D physics engine, spawner, and touch tracking
│       ├── Shop.tsx           # Dojo store, unlockable blades, stages, and juices
│       └── Challenges.tsx     # Daily achievement tracking dashboard
```

---

## ⚙️ Setup and Installation Instructions

### Running Locally

1. **Install Node.js** (v18+ recommended).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Open your browser** to `http://localhost:3000`.

---

## 📱 Packaging for Mobile Devices (Android & iOS)

To package `Slice Rush: Fruit Frenzy` into fully native Android and iOS mobile applications ready for the Google Play Store and Apple App Store, we recommend using **CapacitorJS** (the industry-standard hybrid native container).

### Step-by-Step Native Wrapping Guide

1. **Install Capacitor CLI & Core** in your project root:
   ```bash
   npm install @capacitor/core @capacitor/cli
   ```
2. **Initialize Capacitor** with your app's custom metadata:
   ```bash
   npx cap init "Slice Rush" "com.slicerush.fruitfrenzy" --web-dir=dist
   ```
3. **Add Native Platform Libraries**:
   * For **Android**:
     ```bash
     npm install @capacitor/android
     npx cap add android
     ```
   * For **iOS**:
     ```bash
     npm install @capacitor/ios
     npx cap add ios
     ```
4. **Build and Sync Assets**:
   Run the production compiler, and copy the compiled files directly into the native projects:
   ```bash
   npm run build
   npx cap sync
   ```
5. **Open and Run in Native IDEs**:
   * To build/sign/test on **Android Studio**:
     ```bash
     npx cap open android
     ```
   * To build/sign/test on **Xcode** (macOS required):
     ```bash
     npx cap open ios
     ```

---

## 🏆 Slicing Techniques & Scoring

* **Classic Mode:** Slay standard fruits (+10 pts) and rare fruits (+15-25 pts) before they fall off the screen. You start with **3 Lives**. Hitting a bomb results in an instant Game Over.
* **Time Attack Mode:** Slice as many fruits as possible inside **60 seconds**. Slicing a bomb deducts **10 seconds** and **100 points**. Look for glowing **Time Clocks** to earn **+5 seconds** of bonus time!
* **Endless Dojo:** Slicing speed and spawns accelerate indefinitely. Perfect your reflexes without standard life limitations.
* **Combo Mechanics:** Slicing 2 or more fruits in a single, continuous swipe triggers a **Multi-Slice Combo**, yielding extra bonus points!
