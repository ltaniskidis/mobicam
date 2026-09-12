<template>
  <div class="scanner-wrapper">
    <!-- Quick Action Bar Above Viewport -->
    <div class="scanner-top-bar">
      <!-- File Upload Scan Option -->
      <button @click="triggerFileInput" class="top-btn" :title="lang === 'el' ? 'Σάρωση από αρχείο εικόνας / συλλογή' : 'Scan Image from Gallery / File'">
        <span class="btn-icon">📁</span>
        <span class="btn-label">{{ lang === 'el' ? 'Εικόνα' : 'File' }}</span>
      </button>
      <input 
        type="file" 
        ref="fileInput" 
        accept="image/*" 
        class="hidden-file-input" 
        @change="handleFileUpload" 
      />

      <!-- Quick Macro Mode Toggle in Top Bar -->
      <button 
        @click="toggleMacroMode" 
        :class="['top-btn', 'macro-top-btn', { active: isMacroMode }]"
        :title="lang === 'el' ? 'Macro Mode για πολύ μικρά QR & Ένσημα Καπνού' : 'Macro Mode for tiny QR & Tax Stamps'"
      >
        <span class="btn-icon">🌿</span>
        <span class="btn-label">Macro</span>
        <span v-if="isMacroMode" class="macro-badge-mini">ON</span>
      </button>

      <!-- Torch / Flashlight Toggle in Top Bar (Always visible in grid) -->
      <button 
        @click="toggleTorch" 
        :class="['top-btn', 'torch-top-btn', { active: isTorchOn, 'btn-dim': !isScanning }]"
        :title="lang === 'el' ? 'Άναμμα / Σβήσιμο Φακού Κινητού' : 'Toggle Camera Flashlight'"
      >
        <span class="btn-icon">{{ isTorchOn ? '🔦' : '💡' }}</span>
        <span class="btn-label">{{ isTorchOn ? (lang === 'el' ? 'Φακός ON' : 'Flash ON') : (lang === 'el' ? 'Φακός' : 'Flash') }}</span>
      </button>

      <!-- Scanner Tuning Toggle -->
      <button @click="showSettings = !showSettings" class="top-btn" :class="{ active: showSettings }">
        <span class="btn-icon">⚙️</span>
        <span class="btn-label">{{ lang === 'el' ? 'Ρυθμίσεις' : 'Tuning' }}</span>
      </button>
    </div>

    <!-- Tuning & Settings Accordion Panel -->
    <div v-if="showSettings" class="settings-panel card">
      <div class="panel-header">
        <h4>🔧 {{ lang === 'el' ? 'Ρυθμίσεις Κάμερας, Android & Ένσημα' : 'Camera, Android & Stamp Settings' }}</h4>
        <button @click="showSettings = false" class="btn-close">✕</button>
      </div>

      <!-- Engine Status Box -->
      <div class="setting-group engine-info-group">
        <label>{{ lang === 'el' ? 'Μηχανή Σάρωσης:' : 'Scanning Engine:' }}</label>
        <div class="engine-status-row">
          <span class="engine-pill" :class="{ 'hw-active': isNativeDetectorAvailable }">
            {{ isNativeDetectorAvailable ? '⚡ Android Native ML Kit (BarcodeDetector)' : '⚙️ Software ZXing Engine' }}
          </span>
        </div>
        <small v-if="isNativeDetectorAvailable">
          {{ lang === 'el' ? 'Ενεργή η native μηχανή του Android (όπως το Google Lens) απευθείας στο βίντεο για ακαριαία ανάγνωση μικρών DataMatrix & QR!' : 'Native Android Google ML Kit active directly on GPU stream for instant reading of micro DataMatrix & QR!' }}
        </small>
        <small v-else>
          {{ lang === 'el' ? 'Χρήση λογισμικού ZXing. Για μέγιστη απόδοση χρησιμοποιήστε Google Chrome στο Android.' : 'Using ZXing engine. For best speed use Google Chrome on Android.' }}
        </small>
      </div>

      <!-- Camera Selection & Hardware Capabilities Group -->
      <div v-if="cameras.length > 0" class="setting-group camera-selection-group">
        <label>📷 {{ lang === 'el' ? 'Πίσω Κάμερα (Αυτόματη επιλογή):' : 'Rear Camera (Auto-Selected):' }}</label>
        <select 
          v-model="selectedCameraId" 
          @change="onCameraSelectChange" 
          class="camera-select-dropdown"
        >
          <option v-for="(cam, idx) in cameras" :key="cam.id" :value="cam.id">
            {{ isCameraZero(cam) ? '⭐ ' + (cam.label || 'Camera 0') + ' (' + (lang === 'el' ? 'Κύρια - Φακός & AF' : 'Main - Flash & AF') + ')' : (cam.label || `Camera ${idx + 1}`) }}
          </option>
        </select>
        <div class="camera-caps-summary">
          <span class="cap-tag" :class="{ 'cap-ok': hasTorch, 'cap-no': !hasTorch }">
            {{ hasTorch ? '🔦 Φακός LED: ΝΑΙ' : '💡 Φακός LED: ΟΧΙ' }}
          </span>
          <span class="cap-tag cap-ok">
            🎯 Autofocus: ΝΑΙ
          </span>
          <span class="cap-tag" v-if="videoResolution">
            📐 {{ videoResolution }}
          </span>
          <span class="cap-tag" v-if="maxZoom > 1">
            🔍 Zoom: {{ maxZoom.toFixed(1) }}x
          </span>
        </div>
      </div>

      <!-- Macro Mode Switch & Zoom setting -->
      <div class="setting-group macro-setting-box">
        <div class="setting-row">
          <label>🌿 {{ lang === 'el' ? 'Λειτουργία Macro (Ένσημα Καπνού & Μικρά QR)' : 'Macro Mode (Tax Stamps & Micro 2D)' }}</label>
          <button 
            :class="['pill-btn', { selected: isMacroMode }]" 
            @click="toggleMacroMode"
          >
            {{ isMacroMode ? '✔ ' + (lang === 'el' ? 'ΕΝΕΡΓΟ' : 'ACTIVE') : (lang === 'el' ? 'ΑΝΕΝΕΡΓΟ' : 'OFF') }}
          </button>
        </div>
        <small>{{ lang === 'el' ? 'Εφαρμόζει tele-macro μεγέθυνση και συνεχή εστίαση. Επιτρέπει στο κινητό να διαβάζει το ένσημο από τα 15cm χωρίς να θολώνει.' : 'Applies tele-macro zoom & continuous AF. Allows phone to read stamps from 15cm without macro blur.' }}</small>
        
        <div v-if="isMacroMode" class="macro-sub-settings">
          <label>{{ lang === 'el' ? 'Επίπεδο Macro Zoom:' : 'Macro Zoom Level:' }} {{ macroZoomLevel }}x</label>
          <input 
            type="range" 
            min="1.5" 
            :max="maxZoom > 1 ? maxZoom : 4.0" 
            step="0.5" 
            v-model.number="macroZoomLevel" 
            @input="onMacroZoomChanged"
          >
        </div>
      </div>

      <!-- Video Orientation & Contrast Quick Toggles -->
      <div class="setting-group filter-setting-box">
        <label>{{ lang === 'el' ? 'Εικόνα & Φίλτρα:' : 'Image & Filters:' }}</label>
        <div class="pill-group">
          <button 
            :class="['pill-btn', { selected: isFlipped }]" 
            @click="toggleFlip"
            :title="lang === 'el' ? 'Χρήσιμο αν η κάμερα δείχνει τα γράμματα ανάποδα' : 'Useful if camera mirrors text'"
          >
            🪞 {{ lang === 'el' ? 'Αντιστροφή Καθρέφτη (Flip)' : 'Mirror Flip' }}
          </button>
          <button 
            :class="['pill-btn', { selected: isHighContrast }]" 
            @click="isHighContrast = !isHighContrast"
            :title="lang === 'el' ? 'Αυξάνει την αντίθεση σε γυαλιστερές επιφάνειες' : 'Boosts contrast on glossy packaging'"
          >
            🌓 {{ lang === 'el' ? 'Ενίσχυση Αντίθεσης' : 'High Contrast' }}
          </button>
        </div>
      </div>

      <!-- Scan Area Mode -->
      <div class="setting-group">
        <label>{{ lang === 'el' ? 'Περιοχή Σάρωσης:' : 'Scan Area Mode:' }}</label>
        <div class="pill-group">
          <button 
            :class="['pill-btn', { selected: scanAreaMode === 'full' }]" 
            @click="setScanAreaMode('full')"
          >
            🌐 {{ lang === 'el' ? 'Πλήρης Οθόνη (Όλα τα μεγέθη)' : 'Full Viewport' }}
          </button>
          <button 
            :class="['pill-btn', { selected: scanAreaMode === 'box' }]" 
            @click="setScanAreaMode('box')"
          >
            🎯 {{ lang === 'el' ? 'Στοχευμένο Πλαίσιο' : 'Target Box' }}
          </button>
        </div>
      </div>

      <!-- Crop Area Slider (When box mode is active) -->
      <div v-if="scanAreaMode === 'box'" class="setting-group">
        <label>{{ lang === 'el' ? 'Μέγεθος Πλαισίου:' : 'Box Size:' }} {{ localCrop }}%</label>
        <input type="range" min="30" max="95" v-model.number="localCrop" @change="restartScanner">
      </div>

      <!-- Granular Zoom Slider -->
      <div v-if="maxZoom > 1" class="setting-group">
        <label>Manual Zoom: {{ currentZoom.toFixed(1) }}x</label>
        <input 
          type="range" 
          :min="minZoom" 
          :max="maxZoom" 
          step="0.1" 
          v-model.number="currentZoom" 
          @input="applySpecificZoom(currentZoom)"
        >
      </div>

      <!-- Feedback Toggles -->
      <div class="setting-group toggles-row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="localSound"> 
          <span>🔔 {{ lang === 'el' ? 'Ήχος Σάρωσης' : 'Beep Sound' }}</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="localVibrate"> 
          <span>📳 {{ lang === 'el' ? 'Δόνηση' : 'Vibration' }}</span>
        </label>
      </div>
    </div>

    <!-- Viewport Container -->
    <div 
      class="viewport-box" 
      ref="viewportBox"
      :class="{ 'macro-active-viewport': isMacroMode }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @click="handleViewportClick"
    >
      <!-- On-screen Toast Notification -->
      <transition name="toast-fade">
        <div v-if="toastMessage" :class="['scanner-toast', `toast-${toastType}`]">
          <span>{{ toastMessage }}</span>
        </div>
      </transition>

      <!-- HTML5 QR Code Video Target -->
      <div 
        v-show="isScanning" 
        :id="elementId" 
        class="qr-video-target" 
        :style="cssZoomTransform"
      ></div>

      <!-- Tap-to-Focus Visual Indicator Ring -->
      <div 
        v-if="focusIndicator.show" 
        class="focus-indicator" 
        :class="{ 'macro-focus': isMacroMode }"
        :style="{ left: focusIndicator.x + 'px', top: focusIndicator.y + 'px' }"
      ></div>

      <!-- Detected Code Real-time Bounding Box -->
      <div 
        v-if="detectedBox.show" 
        class="detected-box-overlay"
        :style="{
          left: detectedBox.x + 'px',
          top: detectedBox.y + 'px',
          width: detectedBox.w + 'px',
          height: detectedBox.h + 'px'
        }"
      ></div>

      <!-- Idle Placeholder (When Camera is Stopped) -->
      <div v-if="!isScanning" class="idle-placeholder">
        <div class="idle-icon-wrapper">
          <div class="idle-icon">📷</div>
          <div class="idle-ring"></div>
        </div>
        <p class="idle-text">{{ lang === 'el' ? 'Η κάμερα είναι σε αναμονή' : 'Camera is in standby' }}</p>
        <span class="idle-sub">{{ lang === 'el' ? 'Πατήστε «Έναρξη Σάρωσης» ή ανεβάστε αρχείο εικόνας' : 'Tap "Start Scanner" or upload an image file' }}</span>
      </div>

      <!-- Active Scanning Overlay (Laser & Reticle) -->
      <div v-if="isScanning" class="viewfinder-overlay" :class="{ 'box-mode': scanAreaMode === 'box', 'macro-overlay': isMacroMode }">
        <!-- Laser Scanning Line -->
        <div class="laser-beam" :class="{ 'laser-box': scanAreaMode === 'box', 'laser-macro': isMacroMode }"></div>

        <!-- Reticle Corners -->
        <div class="reticle-box" :style="reticleBoxStyle" :class="{ 'macro-reticle': isMacroMode }">
          <div class="corner top-left"></div>
          <div class="corner top-right"></div>
          <div class="corner bottom-left"></div>
          <div class="corner bottom-right"></div>

          <!-- Macro Mode Center Target Crosshair -->
          <div v-if="isMacroMode" class="macro-crosshair">
            <div class="crosshair-h"></div>
            <div class="crosshair-v"></div>
            <div class="crosshair-box"></div>
          </div>
        </div>

        <!-- Success Flash Effect -->
        <div v-if="scanFlashActive" class="scan-flash-overlay"></div>
      </div>

      <!-- Macro Mode Floating HUD Badge -->
      <div v-if="isScanning && isMacroMode" class="macro-hud-badge">
        <span class="macro-glow-dot"></span>
        <span>🌿 MACRO {{ currentZoom > 1 ? currentZoom.toFixed(1) + 'x' : 'ACTIVE' }}</span>
      </div>

      <!-- Floating Over-Video Controls -->
      <div v-if="isScanning" class="floating-overlay-controls">
        <!-- Dedicated Macro Mode Toggle Button -->
        <button 
          @click.stop="toggleMacroMode" 
          :class="['icon-btn', 'macro-btn', { active: isMacroMode }]" 
          :title="lang === 'el' ? 'Macro Mode (για ένσημα & μικρά QR)' : 'Macro Mode (for tiny QR & stamps)'"
        >
          🌿
        </button>

        <!-- Mirror Flip Toggle -->
        <button 
          @click.stop="toggleFlip" 
          :class="['icon-btn', 'flip-btn', { active: isFlipped }]" 
          :title="lang === 'el' ? 'Αντιστροφή Καθρέφτη (Flip)' : 'Mirror Flip'"
        >
          🪞
        </button>

        <!-- Contrast Boost Toggle -->
        <button 
          @click.stop="isHighContrast = !isHighContrast" 
          :class="['icon-btn', 'contrast-btn', { active: isHighContrast }]" 
          :title="lang === 'el' ? 'Ενίσχυση Αντίθεσης' : 'Contrast Boost'"
        >
          🌓
        </button>

        <!-- Torch Toggle (Always visible during scan) -->
        <button 
          @click.stop="toggleTorch" 
          :class="['icon-btn', 'torch-btn', { active: isTorchOn }]" 
          :title="lang === 'el' ? 'Άναμμα / Σβήσιμο Φακού' : 'Flashlight'"
        >
          {{ isTorchOn ? '🔦' : '💡' }}
        </button>

        <!-- Switch Camera Toggle -->
        <button 
          v-if="cameras.length > 1" 
          @click.stop="cycleCamera" 
          class="icon-btn" 
          :title="lang === 'el' ? 'Εναλλαγή Κάμερας' : 'Switch Camera'"
        >
          🔄
        </button>
      </div>

      <!-- Quick Zoom Pill Bar (Bottom Overlay on Camera) - Always Available like Google Lens -->
      <div v-if="isScanning" class="floating-zoom-bar">
        <button 
          v-for="zoomLevel in availableZoomPresets" 
          :key="zoomLevel.val"
          @click.stop="applySpecificZoom(zoomLevel.val)"
          :class="['zoom-pill', { active: Math.abs(currentZoom - zoomLevel.val) < 0.2, 'macro-pill': zoomLevel.isMacro }]"
        >
          {{ zoomLevel.label }}
        </button>
      </div>
    </div>

    <!-- Guidance Chips -->
    <div v-if="isScanning && isMacroMode && macroGuidanceVisible" class="macro-guidance-chip">
      <span class="chip-text">
        🌿 <strong>{{ lang === 'el' ? 'Συμβουλή για Ένσημα & Μικρά QR:' : 'Tip for Stamps & Micro QR:' }}</strong>
        {{ lang === 'el' ? 'Κρατήστε το κινητό στα 12-18cm και αγγίξτε την οθόνη (Tap) πάνω στο ένσημο για να κλειδώσει η εστίαση!' : 'Hold phone at 12-18cm and tap the screen on the stamp to lock focus!' }}
      </span>
      <button @click="macroGuidanceVisible = false" class="chip-dismiss">✕</button>
    </div>

    <!-- Torch Anti-Glare & Focus Guidance Chip -->
    <div v-if="isScanning && isTorchOn && torchGuidanceVisible" class="torch-guidance-chip">
      <span class="chip-text">
        🔦 <strong>{{ lang === 'el' ? 'Συμβουλή Φακού:' : 'Torch Tip:' }}</strong>
        {{ lang === 'el' ? 'Κρατήστε απόσταση 15-20 εκ. για αποφυγή αντανάκλασης. Αγγίξτε την οθόνη (Tap) για άμεση εστίαση!' : 'Hold 15-20cm away to avoid glare. Tap screen to refocus!' }}
      </span>
      <button @click="torchGuidanceVisible = false" class="chip-dismiss">✕</button>
    </div>

    <!-- Camera & Engine Metadata Badges -->
    <div v-if="isScanning" class="status-badges-container">
      <div class="badge-row">
        <span class="info-badge engine-badge">
          {{ isNativeDetectorAvailable ? '⚡ Google Lens ML Kit' : '⚙️ SW ZXing' }}
        </span>
        <span v-if="videoResolution" class="info-badge camera-badge">
          📐 {{ videoResolution }}
        </span>
        <span class="info-badge" :class="isMacroMode ? 'macro-status-badge' : 'mode-badge'">
          {{ isMacroMode ? '🌿 Macro Mode' : '⚡ 2D/QR Lens' }}
        </span>
        <span v-if="isHighContrast" class="info-badge contrast-badge">
          🌓 High Contrast
        </span>
        <span v-if="currentZoom > 1" class="info-badge zoom-badge">
          🔍 {{ currentZoom.toFixed(1) }}x
        </span>
        <span v-if="isTorchOn" class="info-badge torch-active-badge">
          🔦 {{ lang === 'el' ? 'Φακός ON' : 'Flash ON' }}
        </span>
      </div>
    </div>

    <!-- Error Alert Banner -->
    <div v-if="errorMessage" class="error-banner">
      <span>⚠️ {{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="btn-dismiss-err">✕</button>
    </div>

    <!-- Primary Control Action Bar -->
    <div class="action-bar">
      <button 
        v-if="!isScanning" 
        @click="startScanning" 
        class="btn btn-primary"
        :disabled="isInitializing"
      >
        <span v-if="isInitializing" class="spinner">⏳ {{ lang === 'el' ? 'Εκκίνηση Κάμερας...' : 'Starting Camera...' }}</span>
        <span v-else>▶ {{ lang === 'el' ? 'Έναρξη Σάρωσης (Live)' : 'Start Scanner (Live)' }}</span>
      </button>

      <button 
        v-else 
        @click="stopScanning" 
        class="btn btn-danger"
      >
        ⏹ {{ lang === 'el' ? 'Διακοπή Σάρωσης' : 'Stop Scanner' }}
      </button>
    </div>
  </div>
</template>

<script>
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { readBarcodesFromImageData } from "zxing-wasm/reader";

export default {
  name: "BarcodeScanner",
  props: {
    elementId: {
      type: String,
      default: "barcode-reader-view"
    },
    autoStart: {
      type: Boolean,
      default: false
    },
    soundOnScan: {
      type: Boolean,
      default: true
    },
    vibrateOnScan: {
      type: Boolean,
      default: true
    },
    lang: {
      type: String,
      default: "el"
    }
  },
  data() {
    return {
      html5QrCode: null,
      isScanning: false,
      isInitializing: false,
      errorMessage: "",
      cameras: [],
      selectedCameraId: null,
      isTorchOn: false,
      hasTorch: false,
      toastMessage: "",
      toastType: "info",
      toastTimer: null,
      hardwareCapabilities: {},
      isAutoSwitching: false,
      audioCtx: null,
      isNativeDetectorAvailable: false,
      nativeBarcodeDetector: null,
      nativeScanTimer: null,
      scanFlashActive: false,
      videoResolution: "",
      cropCanvas: null,
      cropCtx: null,
      isDetecting: false,
      wasmTick: 0,

      // Target Tracking Overlay
      detectedBox: {
        show: false,
        x: 0,
        y: 0,
        w: 0,
        h: 0
      },

      // Macro Mode & Packaging Features
      isMacroMode: false,
      macroZoomLevel: 2.5,
      normalSavedZoom: 1,
      hasMacroCamera: false,
      macroCameraId: null,
      normalCameraId: null,
      macroGuidanceVisible: true,
      torchGuidanceVisible: true,
      digitalZoomFallback: 1,
      isFlipped: false,
      isHighContrast: false,

      // Settings & Scan Tuning
      showSettings: false,
      scanProfile: "qr_priority", // 'qr_priority' (QR & DataMatrix) | 'universal'
      scanAreaMode: "full", // 'full' (omni-scan) | 'box'
      localFps: 20,
      localCrop: 70,
      localSound: this.soundOnScan,
      localVibrate: this.vibrateOnScan,

      // Hardware Zoom & Capabilities
      currentZoom: 1,
      minZoom: 1,
      maxZoom: 1,

      // Pinch to Zoom state
      initialPinchDistance: null,
      initialPinchZoom: 1,

      // Tap-to-Focus UI state
      focusIndicator: {
        show: false,
        x: 0,
        y: 0,
        timer: null
      }
    };
  },
  computed: {
    engineName() {
      const hw = this.isNativeDetectorAvailable ? "HW BarcodeDetector (ML Kit)" : "SW ZXing";
      return hw;
    },
    activeCameraLabel() {
      if (!this.selectedCameraId || this.cameras.length === 0) return "";
      const cam = this.cameras.find(c => c.id === this.selectedCameraId);
      let label = cam ? cam.label : "Camera";
      if (label.length > 32) {
        label = label.split(',').pop().trim();
      }
      return label;
    },
    cssZoomTransform() {
      const transforms = [];
      if (this.isFlipped) {
        transforms.push('scaleX(-1)');
      }
      if (this.digitalZoomFallback > 1) {
        transforms.push(`scale(${this.digitalZoomFallback})`);
      }
      const styles = {};
      if (transforms.length > 0) {
        styles.transform = transforms.join(' ');
        styles.transformOrigin = 'center center';
        styles.transition = 'transform 0.2s ease';
      }
      if (this.isHighContrast) {
        styles.filter = 'contrast(1.65) brightness(1.08) grayscale(0.85)';
      }
      return styles;
    },
    availableZoomPresets() {
      const presets = [
        { label: "1x", val: 1.0, isMacro: false },
        { label: "1.5x", val: 1.5, isMacro: false },
        { label: "2x", val: 2.0, isMacro: false },
        { label: "🌿 Macro", val: 2.5, isMacro: true },
        { label: "3x", val: 3.0, isMacro: false }
      ];
      if (this.maxZoom > 3.0 && !presets.some(p => Math.abs(p.val - this.maxZoom) < 0.1)) {
        presets.push({ label: `${this.maxZoom.toFixed(1)}x`, val: this.maxZoom, isMacro: false });
      }
      return presets;
    },
    reticleBoxStyle() {
      if (this.scanAreaMode === 'full') {
        return {
          width: '88%',
          height: '88%',
          top: '6%',
          left: '6%'
        };
      }
      const size = this.localCrop;
      const offset = (100 - size) / 2;
      return {
        width: `${size}%`,
        height: `${size}%`,
        top: `${offset}%`,
        left: `${offset}%`
      };
    }
  },
  watch: {
    soundOnScan(val) { this.localSound = val; },
    vibrateOnScan(val) { this.localVibrate = val; }
  },
  mounted() {
    try {
      localStorage.removeItem("mobicam_torch_camera_id");
    } catch (_) {}
    this.checkNativeBarcodeDetector();
    this.initScannerInstance();
    if (this.autoStart) {
      this.startScanning();
    }
  },
  beforeDestroy() {
    this.cleanupScanner();
  },
  methods: {
    async checkNativeBarcodeDetector() {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          console.log("[Google ML Kit] Supported formats on this device:", supported);
          if (supported && supported.length > 0) {
            this.isNativeDetectorAvailable = true;
            try {
              // Pass ONLY the formats supported by this device to avoid TypeError
              this.nativeBarcodeDetector = new window.BarcodeDetector({ formats: supported });
            } catch (ctorErr) {
              console.warn("[Google ML Kit] Error with formats option, trying default constructor:", ctorErr);
              this.nativeBarcodeDetector = new window.BarcodeDetector();
            }
            console.log("[Google ML Kit] Successfully initialized Android BarcodeDetector!");
          }
        } catch (e) {
          console.warn("[Google ML Kit] BarcodeDetector init error:", e);
          try {
            this.nativeBarcodeDetector = new window.BarcodeDetector();
            this.isNativeDetectorAvailable = true;
          } catch (e2) {
            this.isNativeDetectorAvailable = false;
            this.nativeBarcodeDetector = null;
          }
        }
      }
    },

    getFormatsForProfile() {
      return [
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.PDF_417,
        Html5QrcodeSupportedFormats.AZTEC
      ];
    },

    initScannerInstance() {
      const formats = this.getFormatsForProfile();
      this.html5QrCode = new Html5Qrcode(this.elementId, {
        formatsToSupport: formats,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });
    },

    toggleFlip() {
      this.isFlipped = !this.isFlipped;
      if (this.isScanning) {
        this.restartScanner();
      }
    },

    // Macro Mode Master Toggle
    async toggleMacroMode() {
      this.isMacroMode = !this.isMacroMode;
      this.macroGuidanceVisible = true;

      if (this.isMacroMode) {
        this.normalSavedZoom = this.currentZoom;
        const targetMacroZoom = this.maxZoom > 1 
          ? Math.min(this.maxZoom, Math.max(this.minZoom, this.macroZoomLevel))
          : this.macroZoomLevel;
        
        await this.applySpecificZoom(targetMacroZoom);
        this.applyCloseFocusOptimization();
      } else {
        await this.applySpecificZoom(this.normalSavedZoom || 1);
        this.digitalZoomFallback = 1;
        this.applyContinuousFocus();
      }
    },

    onMacroZoomChanged() {
      if (this.isMacroMode && this.isScanning) {
        this.applySpecificZoom(this.macroZoomLevel);
      }
    },

    async applyCloseFocusOptimization() {
      await this.triggerActiveRefocus();
    },

    async applyContinuousFocus() {
      await this.syncTrackConstraints();
    },

    setScanProfile(profile) {
      if (this.scanProfile === profile) return;
      this.scanProfile = profile;
      this.restartScanner();
    },

    setScanAreaMode(mode) {
      if (this.scanAreaMode === mode) return;
      this.scanAreaMode = mode;
      this.restartScanner();
    },

    async restartScanner() {
      if (this.isScanning) {
        await this.stopScanning();
        await this.cleanupScanner();
        this.initScannerInstance();
        await this.startScanning();
      } else {
        await this.cleanupScanner();
        this.initScannerInstance();
      }
    },

    showToast(msg, type = "info", duration = 3500) {
      this.toastMessage = msg;
      this.toastType = type;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastMessage = "";
      }, duration);
    },

    async onCameraSelectChange() {
      if (this.isScanning) {
        await this.stopScanning();
        await this.cleanupScanner();
        this.initScannerInstance();
        await this.startScanning();
      }
    },

    findCameraZero(cameras) {
      if (!cameras || cameras.length === 0) return null;

      // 1. Explicitly search for Camera 0 (Android Camera2 Main Sensor with Flash & AF)
      const cam0 = cameras.find(c => {
        const l = (c.label || "").toLowerCase();
        if (l.includes("0.5") || l.includes("0.6") || l.includes("front") || l.includes("selfie")) return false;
        return l.includes("camera2 0") || 
               l.includes("camera 0") || 
               l.includes("cam 0") || 
               l.includes("rear 0") || 
               l.includes("back 0") || 
               l.includes("facing back 0") || 
               l.includes("id 0") || 
               /\b0\b/.test(l);
      });
      if (cam0) return cam0;

      // 2. Search for main or primary or wide (excluding auxiliary)
      const mainCam = cameras.find(c => {
        const l = (c.label || "").toLowerCase();
        if (l.includes("ultra") || l.includes("0.5") || l.includes("0.6") || l.includes("tele") || l.includes("depth") || l.includes("macro") || l.includes("front")) return false;
        return l.includes("main") || l.includes("primary") || l.includes("wide") || l.includes("back") || l.includes("rear");
      });
      if (mainCam) return mainCam;

      return cameras[0];
    },

    isCameraZero(cam) {
      if (!cam) return false;
      const l = (cam.label || "").toLowerCase();
      if (l.includes("0.5") || l.includes("0.6") || l.includes("front") || l.includes("selfie")) return false;
      return l.includes("camera2 0") || 
             l.includes("camera 0") || 
             l.includes("rear 0") || 
             l.includes("back 0") || 
             l.includes("id 0") || 
             /\b0\b/.test(l) ||
             cam.id === this.normalCameraId;
    },

    async fetchAvailableCameras() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // 1. Filter out all front / selfie cameras
          const rearCameras = devices.filter(d => {
            const label = (d.label || "").toLowerCase();
            const isFront = label.includes("front") || 
                            label.includes("user") || 
                            label.includes("selfie") || 
                            label.includes("μπροστά") || 
                            label.includes("face") || 
                            label.includes("camera2 1") ||
                            label.includes("forward");
            return !isFront;
          });

          this.cameras = rearCameras.length > 0 ? rearCameras : devices;
          console.log("[Available Rear Cameras]:", this.cameras.map(d => `${d.id}: ${d.label}`));

          // 2. ALWAYS identify Camera 0 as the primary camera
          const cam0 = this.findCameraZero(this.cameras);
          this.normalCameraId = cam0 ? cam0.id : this.cameras[0].id;
          this.selectedCameraId = this.normalCameraId;
        }
      } catch (err) {
        console.warn("Could not enumerate cameras, falling back to facingMode 'environment'", err);
      }
    },

    measureVideoResolution() {
      const video = this.$el.querySelector("video");
      if (video && video.videoWidth && video.videoHeight) {
        this.videoResolution = `${video.videoWidth}x${video.videoHeight}`;
        console.log("[Camera] Active sensor resolution:", this.videoResolution);
      }
    },

    async startScanning() {
      if (this.isScanning || this.isInitializing) return;
      this.errorMessage = "";
      this.isInitializing = true;
      this.currentZoom = 1;
      this.maxZoom = 1;

      try {
        if (this.cameras.length === 0) {
          await this.fetchAvailableCameras();
        }

        if (!this.selectedCameraId) {
          const cam0 = this.findCameraZero(this.cameras);
          this.selectedCameraId = cam0 ? cam0.id : (this.normalCameraId || null);
        }

        if (!this.nativeBarcodeDetector) {
          await this.checkNativeBarcodeDetector();
        }

        // cameraIdOrConfig: either string deviceId or single-key { facingMode: "environment" }
        const cameraIdOrConfig = this.selectedCameraId ? this.selectedCameraId : { facingMode: "environment" };

        const config = {
          fps: this.isMacroMode ? 25 : this.localFps,
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 }
          },
          disableFlip: this.isFlipped ? true : false
        };

        if (this.selectedCameraId) {
          config.videoConstraints.deviceId = { exact: this.selectedCameraId };
        }

        if (this.scanAreaMode === "box") {
          config.qrbox = (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor((minEdge * this.localCrop) / 100);
            return { width: size, height: size };
          };
        }

        await this.html5QrCode.start(
          cameraIdOrConfig,
          config,
          (decodedText, decodedResult) => {
            this.handleScanSuccess(decodedText, decodedResult);
          },
          () => { /* frame missed */ }
        );

        this.isScanning = true;
        this.$emit("status-change", true);
        
        setTimeout(async () => {
          this.checkHardwareCapabilities();
          await this.syncTrackConstraints();
          await this.triggerActiveRefocus();
          this.measureVideoResolution();
          
          if (this.isMacroMode) {
            const targetZoom = this.maxZoom > 1 ? Math.min(this.maxZoom, this.macroZoomLevel) : this.macroZoomLevel;
            await this.applySpecificZoom(targetZoom);
            await this.applyCloseFocusOptimization();
          }

          // Start Ultra-Fast Google Lens / ML Kit multi-scale detector loop
          this.startNativeVideoLoop();
        }, 350);

      } catch (err) {
        console.error("Camera start error:", err);
        this.errorMessage = this.formatErrorMessage(err);
      } finally {
        this.isInitializing = false;
      }
    },

    // Dual Engine Turbo Loop: Google ML Kit GPU + WebAssembly ZXing-C++ multi-scale reader
    startNativeVideoLoop() {
      if (!this.isScanning) return;
      if (this.nativeScanTimer) clearInterval(this.nativeScanTimer);

      this.nativeScanTimer = setInterval(async () => {
        if (!this.isScanning || this.isDetecting) return;
        const video = this.$el.querySelector("video");
        if (!video || video.readyState < 2) return;

        this.isDetecting = true;
        try {
          if (!this.videoResolution && video.videoWidth) {
            this.measureVideoResolution();
          }

          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh || vw < 50 || vh < 50) return;

          let detectedCode = null;
          let fromCrop = false;
          let cropX = 0;
          let cropY = 0;
          let cropW = 0;
          let cropH = 0;

          // Engine 1: Native Google ML Kit on full frame if available
          if (this.nativeBarcodeDetector) {
            try {
              const fullResults = await this.nativeBarcodeDetector.detect(video);
              if (fullResults && fullResults.length > 0) {
                detectedCode = {
                  text: fullResults[0].rawValue,
                  format: (fullResults[0].format || "QR_CODE").toUpperCase(),
                  box: fullResults[0].boundingBox
                };
              }
            } catch (e) { }
          }

          // Scale 2 & 3: High-resolution center crop for small / dense codes (receipts & stamps)
          if (!detectedCode && vw >= 100) {
            if (!this.cropCanvas) {
              this.cropCanvas = document.createElement("canvas");
              this.cropCtx = this.cropCanvas.getContext("2d", { willReadFrequently: true });
            }
            const cropRatio = this.isMacroMode ? 0.35 : 0.50;
            cropW = Math.floor(Math.min(vw, vh) * cropRatio);
            cropH = cropW;
            cropX = Math.floor((vw - cropW) / 2);
            cropY = Math.floor((vh - cropH) / 2);

            this.cropCanvas.width = cropW;
            this.cropCanvas.height = cropH;
            this.cropCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            // Try ML Kit on crop
            if (this.nativeBarcodeDetector) {
              try {
                const cropResults = await this.nativeBarcodeDetector.detect(this.cropCanvas);
                if (cropResults && cropResults.length > 0) {
                  fromCrop = true;
                  detectedCode = {
                    text: cropResults[0].rawValue,
                    format: (cropResults[0].format || "QR_CODE").toUpperCase(),
                    box: cropResults[0].boundingBox
                  };
                }
              } catch (e) { }
            }

            // Engine 2: High-Performance WebAssembly ZXing-C++ Reader
            // Keep native ML Kit at 60fps GPU speed; only run Wasm when needed or throttled
            const shouldRunWasm = !this.nativeBarcodeDetector || (this.wasmTick++ % 5 === 0);
            if (!detectedCode && shouldRunWasm) {
              try {
                const imgData = this.cropCtx.getImageData(0, 0, cropW, cropH);
                const wasmResults = await readBarcodesFromImageData(imgData, {
                  tryHarder: true,
                  tryRotate: true,
                  tryInvert: true,
                  tryDownscale: true
                });

                if (wasmResults && wasmResults.length > 0) {
                  const match = wasmResults[0];
                  fromCrop = true;
                  let box = null;
                  if (match.position) {
                    const minX = Math.min(match.position.topLeft.x, match.position.bottomLeft.x);
                    const maxX = Math.max(match.position.topRight.x, match.position.bottomRight.x);
                    const minY = Math.min(match.position.topLeft.y, match.position.topRight.y);
                    const maxY = Math.max(match.position.bottomLeft.y, match.position.bottomRight.y);
                    box = { x: minX, y: minY, width: Math.max(10, maxX - minX), height: Math.max(10, maxY - minY) };
                  }
                  detectedCode = {
                    text: match.text,
                    format: (match.format || "QR_CODE").toUpperCase(),
                    box: box
                  };
                }
              } catch (wasmErr) { }
            }
          }

          if (detectedCode && detectedCode.text) {
            if (detectedCode.box) {
              const videoRect = video.getBoundingClientRect();
              const scaleX = videoRect.width / (video.videoWidth || videoRect.width);
              const scaleY = videoRect.height / (video.videoHeight || videoRect.height);

              let bx = detectedCode.box.x;
              let by = detectedCode.box.y;
              let bw = detectedCode.box.width;
              let bh = detectedCode.box.height;

              if (fromCrop) {
                bx += cropX;
                by += cropY;
              }

              this.detectedBox = {
                show: true,
                x: bx * scaleX,
                y: by * scaleY,
                w: bw * scaleX,
                h: bh * scaleY
              };
              setTimeout(() => { this.detectedBox.show = false; }, 350);
            }

            this.handleScanSuccess(detectedCode.text, {
              result: {
                format: { formatName: detectedCode.format },
                raw: detectedCode
              }
            });
          }
        } catch (_) { } finally {
          this.isDetecting = false;
        }
      }, 50); // Dual Engine runs every 50ms (20fps)!
    },

    stopNativeVideoLoop() {
      if (this.nativeScanTimer) {
        clearInterval(this.nativeScanTimer);
        this.nativeScanTimer = null;
      }
      this.detectedBox.show = false;
    },

    async stopScanning() {
      this.stopNativeVideoLoop();
      this.videoResolution = "";
      this.cropCanvas = null;
      this.cropCtx = null;
      if (!this.html5QrCode || !this.isScanning) return;
      try {
        await this.html5QrCode.stop();
        this.isScanning = false;
        this.$emit("status-change", false);
        this.isTorchOn = false;
        this.hasTorch = false;
        this.currentZoom = 1;
        this.maxZoom = 1;
        this.digitalZoomFallback = 1;
      } catch (err) {
        console.error("Failed to stop scanner cleanly:", err);
      }
    },

    async cleanupScanner() {
      this.stopNativeVideoLoop();
      if (this.html5QrCode) {
        try {
          if (this.isScanning) {
            await this.html5QrCode.stop();
          }
          await this.html5QrCode.clear();
        } catch (e) { }
        this.html5QrCode = null;
      }
    },

    handleScanSuccess(decodedText, decodedResult) {
      if (!decodedText) return;

      this.scanFlashActive = true;
      setTimeout(() => { this.scanFlashActive = false; }, 250);

      if (this.localSound) {
        try { this.playSuccessBeep(); } catch (e) { }
      }

      if (this.localVibrate && "vibrate" in navigator) {
        try { navigator.vibrate(80); } catch (e) { }
      }

      this.$emit("scan", {
        text: decodedText,
        result: decodedResult,
        timestamp: new Date().toISOString()
      });
    },

    async cycleCamera() {
      if (this.cameras.length < 2) return;
      const currentIndex = this.cameras.findIndex(c => c.id === this.selectedCameraId);
      const nextIndex = (currentIndex + 1) % this.cameras.length;
      this.selectedCameraId = this.cameras[nextIndex].id;
      const camLabel = this.cameras[nextIndex].label || `Camera ${nextIndex + 1}`;
      this.showToast(`📷 ${camLabel}`, "info", 2000);

      if (this.isScanning) {
        await this.stopScanning();
        await this.cleanupScanner();
        this.initScannerInstance();
        await this.startScanning();
      }
    },

    checkHardwareCapabilities() {
      try {
        const video = this.$el.querySelector("video");
        const stream = video && video.srcObject;
        const track = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
        const trackCaps = track && track.getCapabilities ? track.getCapabilities() : null;
        const html5Caps = this.html5QrCode ? this.html5QrCode.getRunningTrackCapabilities() : null;

        const capabilities = trackCaps || html5Caps || {};
        this.hardwareCapabilities = capabilities;
        console.log("[Camera Capabilities]", capabilities);

        this.hasTorch = capabilities.torch !== undefined ? Boolean(capabilities.torch) : true;
        if (capabilities.zoom) {
          this.minZoom = capabilities.zoom.min || 1;
          this.maxZoom = Math.min(capabilities.zoom.max || 1, 5);
          this.currentZoom = this.minZoom;
        }
      } catch (e) {
        this.hasTorch = true;
        this.maxZoom = 1;
      }
    },

    async applySpecificZoom(zoomVal) {
      if (this.maxZoom > 1) {
        const targetZoom = Math.max(this.minZoom, Math.min(zoomVal, this.maxZoom));
        this.currentZoom = targetZoom;
        this.digitalZoomFallback = 1;
        await this.syncTrackConstraints({ zoom: targetZoom });
      } else {
        this.currentZoom = zoomVal;
        this.digitalZoomFallback = zoomVal;
      }
    },

    async syncTrackConstraints(options = {}) {
      const video = this.$el.querySelector("video");
      const stream = video && video.srcObject;
      const track = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
      if (!track) return false;

      const caps = (track.getCapabilities && track.getCapabilities()) || {};

      // 1. Build the unified advanced constraint set
      const adv = {};

      // Torch / Flashlight state
      adv.torch = !!this.isTorchOn;

      // Continuous Autofocus (Crucial: Prevents lens freezing or resetting to infinity!)
      adv.focusMode = "continuous";

      // Continuous Auto-Exposure
      adv.exposureMode = "continuous";

      // Continuous White Balance
      adv.whiteBalanceMode = "continuous";

      // Hardware Zoom
      if (caps.zoom && this.currentZoom > 1) {
        const minZ = caps.zoom.min || 1;
        const maxZ = caps.zoom.max || 1;
        adv.zoom = Math.max(minZ, Math.min(this.currentZoom, maxZ));
      }

      // Anti-Glare Exposure Compensation:
      // When torch shines on white receipt paper at close range, reduce exposure by -0.8 to -1.0 EV
      // to eliminate white burnout / glare reflection that blinds the sensor and autofocus.
      if (caps.exposureCompensation) {
        if (this.isTorchOn) {
          const minEV = caps.exposureCompensation.min !== undefined ? caps.exposureCompensation.min : -2;
          adv.exposureCompensation = Math.max(minEV, -1.0);
        } else {
          adv.exposureCompensation = 0;
        }
      }

      // Merge runtime overrides
      Object.assign(adv, options);

      // Attempt 1: Combined full constraint
      try {
        await track.applyConstraints({ advanced: [adv] });
        return true;
      } catch (errCombined) {
        console.warn("[CameraConstraints] Combined applyConstraints failed, trying minimal:", errCombined);
      }

      // Attempt 2: Minimal torch + focusMode continuous
      try {
        const minAdv = { torch: !!this.isTorchOn };
        if (!caps.focusMode || (Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous"))) {
          minAdv.focusMode = "continuous";
        }
        await track.applyConstraints({ advanced: [minAdv] });
        return true;
      } catch (errMin) {
        console.warn("[CameraConstraints] Minimal torch+focus failed:", errMin);
      }

      // Attempt 3: Isolated torch applyConstraints
      try {
        await track.applyConstraints({ advanced: [{ torch: !!this.isTorchOn }] });
        try {
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
        } catch (_) {}
        return true;
      } catch (errIsolated) {
        console.warn("[CameraConstraints] Isolated torch failed:", errIsolated);
      }

      // Attempt 4: html5QrCode applyVideoConstraints
      if (this.html5QrCode && this.html5QrCode.applyVideoConstraints) {
        try {
          await this.html5QrCode.applyVideoConstraints({ advanced: [adv] });
          return true;
        } catch (_) {}
      }

      return false;
    },

    async triggerActiveRefocus() {
      const video = this.$el.querySelector("video");
      const stream = video && video.srcObject;
      const track = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
      if (!track) return;

      try {
        // Step 1: Force Android Camera2 to perform an active autofocus sweep
        await track.applyConstraints({
          advanced: [{ focusMode: "single-shot" }]
        });
      } catch (_) {}

      // Step 2: Lock back into continuous autofocus & re-sync all parameters
      setTimeout(async () => {
        try {
          await this.syncTrackConstraints();
        } catch (_) {}
      }, 150);
    },

    async toggleTorch() {
      if (!this.isScanning) {
        this.showToast(this.lang === "el" ? "⚠️ Ξεκινήστε πρώτα την κάμερα" : "⚠️ Start camera first", "warning");
        return;
      }

      const video = this.$el.querySelector("video");
      const stream = video && video.srcObject;
      const track = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;

      if (!track) {
        this.showToast(this.lang === "el" ? "⚠️ Δεν βρέθηκε ενεργή κάμερα" : "⚠️ No active video track", "error");
        return;
      }

      const targetTorch = !this.isTorchOn;
      this.isTorchOn = targetTorch;

      const applied = await this.syncTrackConstraints();

      if (applied) {
        this.hasTorch = true;
        this.showToast(
          this.isTorchOn 
            ? (this.lang === "el" ? "🔦 Φακός: Ενεργός (Anti-Glare & Εστίαση)" : "🔦 Flashlight: ON") 
            : (this.lang === "el" ? "💡 Φακός: Ανενεργός" : "💡 Flashlight: OFF"),
          "info",
          2500
        );

        // When torch turns ON or OFF, immediately trigger autofocus sweeps so the lens never blurs!
        setTimeout(() => {
          this.triggerActiveRefocus();
        }, 100);
        setTimeout(() => {
          this.triggerActiveRefocus();
        }, 450);

      } else {
        // Fallback: If combined failed, try isolated torch application
        let isolatedSuccess = false;
        try {
          await track.applyConstraints({
            advanced: [{ torch: targetTorch }]
          });
          isolatedSuccess = true;
        } catch (e1) {
          console.warn("[Torch] Isolated track.applyConstraints failed:", e1);
        }

        if (isolatedSuccess) {
          this.isTorchOn = targetTorch;
          this.hasTorch = true;
          this.showToast(
            this.isTorchOn ? "🔦 Φακός: Ενεργός" : "💡 Φακός: Ανενεργός",
            "info",
            2000
          );
          setTimeout(() => {
            this.triggerActiveRefocus();
          }, 120);
        } else {
          // Revert state
          this.isTorchOn = !targetTorch;
          this.showToast(
            this.lang === "el" 
              ? "⚠️ Ο φακός δεν υποστηρίζεται σε αυτή την κάμερα." 
              : "⚠️ Torch not supported on this camera.",
            "error",
            3000
          );
        }
      }
    },

    // Pinch-to-Zoom Gesture Handlers
    handleTouchStart(e) {
      if (!this.isScanning) return;
      if (e.touches.length === 2) {
        this.initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        this.initialPinchZoom = this.currentZoom;
      }
    },

    handleTouchMove(e) {
      if (!this.isScanning || e.touches.length !== 2 || !this.initialPinchDistance) return;
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDistance / this.initialPinchDistance;
      const maxLimit = this.maxZoom > 1 ? this.maxZoom : 4.0;
      const targetZoom = Math.max(this.minZoom, Math.min(this.initialPinchZoom * ratio, maxLimit));
      this.applySpecificZoom(targetZoom);
    },

    handleTouchEnd(e) {
      if (e.touches.length < 2) {
        this.initialPinchDistance = null;
      }
    },

    // Tap-to-Focus Handler (Locks camera focus on tapped point & triggers AF sweep)
    async handleViewportClick(e) {
      if (!this.isScanning) return;
      const rect = this.$refs.viewportBox.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.focusIndicator = { show: true, x, y };
      if (this.focusIndicator.timer) clearTimeout(this.focusIndicator.timer);
      this.focusIndicator.timer = setTimeout(() => {
        this.focusIndicator.show = false;
      }, 1000);

      // Re-trigger hardware AF sweep & continuous focus lock
      await this.triggerActiveRefocus();
    },

    // File / Gallery Upload Scan Handler
    triggerFileInput() {
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click();
      }
    },

    async handleFileUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      this.errorMessage = "";
      try {
        // Step 1: Load image to canvas and decode via modern C++ WebAssembly
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const wasmResults = await readBarcodesFromImageData(imgData, {
          tryHarder: true,
          tryRotate: true,
          tryInvert: true,
          tryDownscale: true
        });

        if (wasmResults && wasmResults.length > 0) {
          const match = wasmResults[0];
          this.handleScanSuccess(match.text, {
            result: { format: { formatName: match.format } }
          });
          return;
        }

        // Step 2: Fallback to html5QrCode.scanFile
        if (!this.html5QrCode) {
          this.initScannerInstance();
        }
        const decodedText = await this.html5QrCode.scanFile(file, true);
        this.handleScanSuccess(decodedText, {
          result: { format: { formatName: "QR / Barcode File" } }
        });
      } catch (err) {
        this.errorMessage = this.lang === 'el' 
          ? "Δεν βρέθηκε αναγνωρίσιμο QR ή Barcode στην εικόνα." 
          : "Could not detect a valid QR or Barcode in this image.";
      } finally {
        event.target.value = "";
      }
    },

    playSuccessBeep() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === "suspended") this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(950, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);
      } catch (e) { }
    },

    formatErrorMessage(err) {
      if (typeof err === "string") return err;
      if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
        return this.lang === 'el' 
          ? "Η πρόσβαση στην κάμερα απορρίφθηκε. Παρακαλούμε επιτρέψτε την κάμερα στις ρυθμίσεις του browser."
          : "Camera permission denied. Please allow camera access in browser settings.";
      }
      if (err.name === "NotFoundError") {
        return this.lang === 'el' ? "Δεν βρέθηκε κάμερα στη συσκευή." : "No camera found on this device.";
      }
      if (err.name === "NotReadableError") {
        return this.lang === 'el' ? "Η κάμερα χρησιμοποιείται ήδη από άλλη εφαρμογή." : "Camera is already in use by another app.";
      }
      return err.message || "Failed to start camera.";
    }
  }
};
</script>

<style scoped>
.scanner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.scanner-top-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: 100%;
  margin-bottom: 12px;
  gap: 6px;
  box-sizing: border-box;
}

.hidden-file-input {
  display: none;
}

.top-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 8px 4px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  transition: all 0.2s;
  box-sizing: border-box;
}

.top-btn .btn-icon {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.top-btn .btn-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-btn.btn-dim {
  opacity: 0.7;
}

.top-btn:hover, .top-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #38bdf8;
}

.macro-top-btn.active {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
}

.macro-badge-mini {
  background: #10b981;
  color: #064e3b;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 2px;
}

.torch-top-btn.active {
  background: rgba(245, 158, 11, 0.25);
  border-color: #f59e0b;
  color: #fbbf24;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.5);
}

@media (max-width: 380px) {
  .scanner-top-bar {
    gap: 4px;
  }
  .top-btn {
    padding: 7px 2px;
    font-size: 0.7rem;
    gap: 2px;
  }
  .top-btn .btn-icon {
    font-size: 0.85rem;
  }
}

.settings-panel {
  width: 100%;
  margin-bottom: 14px;
  background: #1e293b;
  border: 1px solid #3b82f6;
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.engine-info-group {
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 14px;
}

.engine-pill {
  font-size: 0.76rem;
  font-weight: 700;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
}

.engine-pill.hw-active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.macro-setting-box {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 10px 12px;
  border-radius: 10px;
}

.filter-setting-box {
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 10px 12px;
  border-radius: 10px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.macro-sub-settings {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(16, 185, 129, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h4 {
  font-size: 0.92rem;
  color: #38bdf8;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
}

.setting-group {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
}

.setting-group label {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #e2e8f0;
}

.pill-group {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.pill-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s;
}

.pill-btn.selected {
  background: #2563eb;
  border-color: #38bdf8;
  color: white;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
}

.setting-group input[type="range"] {
  width: 100%;
  accent-color: #38bdf8;
  margin-bottom: 4px;
}

.setting-group small {
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.3;
}

.toggles-row {
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #e2e8f0;
  cursor: pointer;
}

/* Viewport Area */
.viewport-box {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #020617;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  transition: box-shadow 0.3s ease;
}

.viewport-box.macro-active-viewport {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 0 2px rgba(16, 185, 129, 0.5);
}

.qr-video-target {
  width: 100% !important;
  height: 100% !important;
  position: absolute;
  top: 0;
  left: 0;
}

.qr-video-target ::v-deep video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

/* Macro HUD Badge */
.macro-hud-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(6, 78, 59, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(52, 211, 153, 0.6);
  color: #34d399;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 22;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
}

.macro-glow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #34d399;
  box-shadow: 0 0 8px #34d399;
  animation: pulseDot 1.2s infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* Detected Box Highlight */
.detected-box-overlay {
  position: absolute;
  border: 3px solid #10b981;
  background: rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  box-shadow: 0 0 16px #10b981;
  pointer-events: none;
  z-index: 28;
  animation: boxDetectPulse 0.3s ease-out;
}

@keyframes boxDetectPulse {
  from { transform: scale(1.1); opacity: 0.8; }
  to { transform: scale(1); opacity: 1; }
}

/* Tap-to-Focus Indicator */
.focus-indicator {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 2px solid #38bdf8;
  border-radius: 8px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 30;
  box-shadow: 0 0 12px #38bdf8;
  animation: pulseFocus 0.9s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}

.focus-indicator.macro-focus {
  border-color: #34d399;
  box-shadow: 0 0 14px #34d399;
}

@keyframes pulseFocus {
  0% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* Viewfinder Overlay, Reticle & Laser */
.viewfinder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.reticle-box {
  position: absolute;
  transition: all 0.25s ease;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #38bdf8;
  border-style: solid;
  transition: border-color 0.3s;
}

.macro-reticle .corner {
  border-color: #34d399 !important;
}

.top-left { top: 0; left: 0; border-width: 4px 0 0 4px; border-top-left-radius: 10px; }
.top-right { top: 0; right: 0; border-width: 4px 4px 0 0; border-top-right-radius: 10px; }
.bottom-left { bottom: 0; left: 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 10px; }
.bottom-right { bottom: 0; right: 0; border-width: 0 4px 4px 0; border-bottom-right-radius: 10px; }

/* Macro Mode Center Target Crosshair */
.macro-crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.crosshair-h {
  position: absolute;
  width: 20px;
  height: 1px;
  background: rgba(52, 211, 153, 0.7);
}

.crosshair-v {
  position: absolute;
  width: 1px;
  height: 20px;
  background: rgba(52, 211, 153, 0.7);
}

.crosshair-box {
  width: 24px;
  height: 24px;
  border: 1px dashed rgba(52, 211, 153, 0.6);
  border-radius: 4px;
}

/* Futuristic Animated Laser Beam */
.laser-beam {
  position: absolute;
  left: 6%;
  width: 88%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #38bdf8, #818cf8, #38bdf8, transparent);
  box-shadow: 0 0 14px #38bdf8, 0 0 4px #fff;
  animation: scanMove 2.4s ease-in-out infinite alternate;
  z-index: 12;
}

.laser-beam.laser-box {
  left: 15%;
  width: 70%;
}

.laser-beam.laser-macro {
  background: linear-gradient(90deg, transparent, #34d399, #10b981, #34d399, transparent) !important;
  box-shadow: 0 0 14px #10b981, 0 0 6px #fff !important;
  animation: scanMove 1.8s ease-in-out infinite alternate !important;
}

@keyframes scanMove {
  0% { top: 12%; opacity: 0.2; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 88%; opacity: 0.2; }
}

/* Flash on Scan */
.scan-flash-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(34, 197, 94, 0.35);
  z-index: 25;
  animation: flashFade 0.25s ease-out forwards;
}

@keyframes flashFade {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Floating Overlays */
.floating-overlay-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 20;
}

.icon-btn {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:active { transform: scale(0.92); }

.macro-btn.active {
  background: #059669;
  border-color: #34d399;
  box-shadow: 0 0 16px rgba(52, 211, 153, 0.7);
}

.flip-btn.active {
  background: #6366f1;
  border-color: #818cf8;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.7);
}

.contrast-btn.active {
  background: #d97706;
  border-color: #f59e0b;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.7);
}

.torch-btn.active {
  background: #f59e0b;
  border-color: #fbbf24;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.7);
}

/* Floating Zoom Bar */
.floating-zoom-bar {
  position: absolute;
  bottom: 12px;
  display: flex;
  gap: 6px;
  z-index: 20;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.zoom-pill {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.zoom-pill.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.zoom-pill.macro-pill.active {
  background: #10b981 !important;
  color: white !important;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.7) !important;
}

/* Macro Guidance Chip */
.macro-guidance-chip {
  width: 100%;
  margin-top: 10px;
  background: rgba(6, 78, 59, 0.7);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #d1fae5;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  line-height: 1.35;
}

/* Torch Guidance Chip */
.torch-guidance-chip {
  width: 100%;
  margin-top: 10px;
  background: rgba(120, 53, 15, 0.75);
  border: 1px solid rgba(245, 158, 11, 0.45);
  color: #fef3c7;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  line-height: 1.35;
}

.chip-dismiss {
  background: none;
  border: none;
  color: #6ee7b7;
  cursor: pointer;
  font-size: 0.85rem;
}

/* Idle State */
.idle-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  text-align: center;
  padding: 24px;
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 5;
}

.idle-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.idle-icon {
  font-size: 2.8rem;
  z-index: 2;
}

.idle-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px dashed rgba(56, 189, 248, 0.3);
  animation: rotateRing 12s linear infinite;
}

@keyframes rotateRing {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.idle-text {
  font-size: 1.05rem;
  font-weight: 600;
  color: #cbd5e1;
}

.idle-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 6px;
  max-width: 260px;
}

/* Badges */
.status-badges-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  align-items: center;
}

.badge-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.info-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

.engine-badge {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.mode-badge {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.macro-status-badge {
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  font-weight: 700;
}

.flipped-badge {
  color: #818cf8;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.35);
  font-weight: 700;
}

.contrast-badge {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  font-weight: 700;
}

.zoom-badge {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.camera-badge {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Error Banner */
.error-banner {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  border-radius: 10px;
  font-size: 0.82rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.btn-dismiss-err {
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Action Button */
.action-bar {
  margin-top: 14px;
  width: 100%;
}

.btn {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

.btn-danger:active { transform: scale(0.98); }

/* Camera Selector Dropdown & Capabilities */
.camera-select-dropdown {
  width: 100%;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.9);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 6px;
  outline: none;
}

.camera-caps-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.cap-tag {
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.cap-tag.cap-ok {
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
}

.cap-tag.cap-no {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
}

/* Scanner On-Screen Toast Messages */
.scanner-toast {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  z-index: 120;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  text-align: center;
  max-width: 90%;
  pointer-events: none;
}

.toast-info {
  background: rgba(15, 23, 42, 0.95);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  backdrop-filter: blur(8px);
}

.toast-warning {
  background: rgba(45, 26, 0, 0.95);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  backdrop-filter: blur(8px);
}

.toast-error {
  background: rgba(69, 10, 10, 0.95);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
  backdrop-filter: blur(8px);
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter, .toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

.torch-active-badge {
  color: #facc15;
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.4);
  font-weight: 700;
}
</style>
