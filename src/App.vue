<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="brand">
        <span class="logo-icon">📱</span>
        <div>
          <h1>MobiCam Scanner <span class="version-tag">v3.6 (Anti-Blur Torch & Active AF Lock)</span></h1>
          <span class="subtitle">{{ t('appSubtitle') }}</span>
        </div>
      </div>
      <div class="header-actions">
        <!-- Language Switcher -->
        <button @click="toggleLanguage" class="btn-lang" :title="t('switchLang')">
          {{ currentLang === 'el' ? '🇬🇷 EL' : '🇬🇧 EN' }}
        </button>

        <div class="header-badges">
          <div class="unique-badge" v-if="uniqueCount > 0" :title="t('uniqueCodes')">
            🧬 {{ uniqueCount }} {{ t('unique') }}
          </div>
          <div class="status-badge" :class="{ live: isScannerActive }">
            <span class="dot"></span>
            {{ isScannerActive ? "LIVE" : "STANDBY" }}
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Scanner Component Section -->
      <section class="card scanner-card">
        <BarcodeScanner 
          ref="scanner"
          :autoStart="false"
          :soundOnScan="true"
          :vibrateOnScan="true"
          :lang="currentLang"
          @scan="onBarcodeDetected"
          @status-change="isScannerActive = $event"
        />
      </section>

      <!-- Latest Scan Result Hero Box -->
      <section v-if="latestScan" class="card result-card">
        <div class="card-header">
          <div class="result-type-badge">
            <span class="type-icon">{{ getTypeIcon(latestScan.parsed.type) }}</span>
            <span class="card-title">{{ latestScan.parsed.title || t('latestScan') }}</span>
          </div>
          <span class="format-tag">{{ latestScan.formatName }}</span>
        </div>

        <!-- Dynamic Parsed Content View -->
        <div class="parsed-content-area">
          <!-- 1. WiFi QR Code -->
          <div v-if="latestScan.parsed.type === 'wifi'" class="wifi-box">
            <div class="wifi-field">
              <span class="label">SSID (Network):</span>
              <strong class="value">{{ latestScan.parsed.ssid }}</strong>
            </div>
            <div v-if="latestScan.parsed.password" class="wifi-field">
              <span class="label">Password:</span>
              <code class="value-code">{{ latestScan.parsed.password }}</code>
            </div>
            <div class="wifi-field">
              <span class="label">Security:</span>
              <span class="value-sub">{{ latestScan.parsed.security }}</span>
            </div>
          </div>

          <!-- 2. vCard Contact -->
          <div v-else-if="latestScan.parsed.type === 'vcard'" class="vcard-box">
            <div class="vcard-name">👤 {{ latestScan.parsed.name }}</div>
            <div v-if="latestScan.parsed.org" class="vcard-field">🏢 {{ latestScan.parsed.org }}</div>
            <div v-if="latestScan.parsed.phone" class="vcard-field">📞 {{ latestScan.parsed.phone }}</div>
            <div v-if="latestScan.parsed.email" class="vcard-field">✉️ {{ latestScan.parsed.email }}</div>
          </div>

          <!-- 3. Product Barcode -->
          <div v-else-if="latestScan.parsed.type === 'product'" class="product-box">
            <div class="product-code">🏷️ {{ latestScan.parsed.code }}</div>
            <span class="product-hint">{{ t('productBarcodeDesc') }}</span>
          </div>

          <!-- Default: Raw Payload Code Box -->
          <div class="payload-box">
            <code>{{ latestScan.text }}</code>
          </div>
        </div>

        <!-- Action Buttons depending on type -->
        <div class="result-actions">
          <!-- Copy Button -->
          <button @click="copyToClipboard(latestScan.text)" class="btn-sm btn-outline">
            📋 {{ copied ? t('copied') : t('copyText') }}
          </button>

          <!-- WiFi Copy Password Button -->
          <button 
            v-if="latestScan.parsed.type === 'wifi' && latestScan.parsed.password"
            @click="copyToClipboard(latestScan.parsed.password, t('copiedWifiPass'))"
            class="btn-sm btn-action btn-wifi"
          >
            🔑 {{ t('copyWifiPass') }}
          </button>

          <!-- Open Web Link -->
          <a 
            v-if="latestScan.parsed.type === 'url'" 
            :href="latestScan.parsed.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-sm btn-action"
          >
            🔗 {{ t('openLink') }}
          </a>

          <!-- Call Phone -->
          <a 
            v-if="latestScan.parsed.type === 'tel'" 
            :href="latestScan.parsed.actionUrl" 
            class="btn-sm btn-action btn-phone"
          >
            📞 {{ t('callNumber') }}
          </a>

          <!-- Send Email -->
          <a 
            v-if="latestScan.parsed.type === 'email'" 
            :href="latestScan.parsed.actionUrl" 
            class="btn-sm btn-action btn-email"
          >
            ✉️ {{ t('sendEmail') }}
          </a>

          <!-- Open Maps -->
          <a 
            v-if="latestScan.parsed.type === 'geo'" 
            :href="latestScan.parsed.mapsUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-sm btn-action btn-maps"
          >
            🗺️ {{ t('openMaps') }}
          </a>

          <!-- Search Product on Google -->
          <a 
            v-if="latestScan.parsed.type === 'product'" 
            :href="latestScan.parsed.searchUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-sm btn-action btn-product"
          >
            🔍 Google
          </a>

          <!-- Search Food / Specs -->
          <a 
            v-if="latestScan.parsed.type === 'product'" 
            :href="latestScan.parsed.openFoodFactsUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-sm btn-outline"
          >
            🍎 OpenFoodFacts
          </a>

          <!-- Download Contact VCF -->
          <button 
            v-if="latestScan.parsed.type === 'vcard'" 
            @click="downloadVcf(latestScan)" 
            class="btn-sm btn-action"
          >
            💾 {{ t('saveContact') }}
          </button>
        </div>
      </section>

      <!-- Scan History Section -->
      <section v-if="scans.length > 0" class="card history-card">
        <div class="card-header">
          <div class="history-title-wrap">
            <span class="card-title">📜 {{ t('history') }} ({{ filteredScans.length }})</span>
          </div>

          <!-- History Export & Action Buttons -->
          <div class="history-controls">
            <button @click="exportCSV" class="btn-xs btn-outline" :title="t('exportCSV')">
              📊 CSV
            </button>
            <button @click="exportJSON" class="btn-xs btn-outline" :title="t('exportJSON')">
              🗄️ JSON
            </button>
            <button @click="clearHistory" class="btn-xs btn-danger-link">
              🗑️ {{ t('clear') }}
            </button>
          </div>
        </div>

        <!-- History Search Bar -->
        <div class="history-search-bar">
          <span class="search-icon">🔎</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="t('searchPlaceholder')" 
            class="search-input" 
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">✕</button>
        </div>

        <!-- History Items List -->
        <ul class="history-list">
          <li v-for="(item, index) in filteredScans" :key="item.time + '-' + index" class="history-item">
            <div class="history-meta">
              <div class="meta-left">
                <span class="type-pill">{{ getTypeIcon(item.parsed?.type) }} {{ item.parsed?.type || 'code' }}</span>
                <span class="format-badge">{{ item.formatName }}</span>
              </div>
              <div class="meta-right">
                <span class="time">{{ item.timeFormatted }}</span>
                <button @click="copyToClipboard(item.text)" class="btn-icon" :title="t('copy')">📋</button>
                <button @click="removeScan(item)" class="btn-icon delete-icon" :title="t('delete')">✕</button>
              </div>
            </div>
            <div class="history-text" @click="copyToClipboard(item.text)">{{ item.text }}</div>
          </li>
        </ul>
      </section>
    </main>

    <!-- Global Toast Notification -->
    <transition name="toast">
      <div v-if="toastMessage" class="app-toast">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script>
import BarcodeScanner from "./components/BarcodeScanner.vue";
import { parseScanResult } from "./utils/parser.js";
import { exportToCSV, exportToJSON } from "./utils/export.js";

const STORAGE_KEY = "mobicam_scan_history_v1";
const LANG_KEY = "mobicam_lang_pref";

const translations = {
  el: {
    appSubtitle: "Υπερ-ταχύς Αναγνώστης QR & Barcode Κάμερας",
    switchLang: "Αλλαγή σε Αγγλικά",
    unique: "Μοναδικά",
    uniqueCodes: "Συνολικά μοναδικά διαβασμένα",
    latestScan: "Τελευταίο Αποτέλεσμα",
    copyText: "Αντιγραφή",
    copied: "Αντιγράφηκε!",
    openLink: "Άνοιγμα Συνδέσμου",
    callNumber: "Κλήση",
    sendEmail: "Αποστολή Email",
    openMaps: "Χάρτες",
    copyWifiPass: "Κωδικός WiFi",
    copiedWifiPass: "Ο κωδικός WiFi αντιγράφηκε!",
    saveContact: "Αποθήκευση Επαφής (.vcf)",
    productBarcodeDesc: "Αναγνωρίστηκε εμπορικό barcode προϊόντος.",
    history: "Ιστορικό Σαρώσεων",
    clear: "Καθαρισμός",
    exportCSV: "Εξαγωγή σε CSV",
    exportJSON: "Εξαγωγή σε JSON",
    searchPlaceholder: "Αναζήτηση στο ιστορικό...",
    delete: "Διαγραφή",
    copy: "Αντιγραφή",
    csvExportSuccess: "Το αρχείο CSV δημιουργήθηκε!",
    jsonExportSuccess: "Το αρχείο JSON δημιουργήθηκε!"
  },
  en: {
    appSubtitle: "High-Speed Camera QR & Barcode Reader",
    switchLang: "Switch to Greek",
    unique: "Unique",
    uniqueCodes: "Total unique codes scanned",
    latestScan: "Latest Detected Code",
    copyText: "Copy Text",
    copied: "Copied!",
    openLink: "Open Link",
    callNumber: "Call",
    sendEmail: "Send Email",
    openMaps: "Maps",
    copyWifiPass: "WiFi Pass",
    copiedWifiPass: "WiFi password copied!",
    saveContact: "Save Contact (.vcf)",
    productBarcodeDesc: "Commercial product barcode recognized.",
    history: "Scan History",
    clear: "Clear",
    exportCSV: "Export CSV",
    exportJSON: "Export JSON",
    searchPlaceholder: "Filter history...",
    delete: "Delete",
    copy: "Copy",
    csvExportSuccess: "CSV file generated!",
    jsonExportSuccess: "JSON file generated!"
  }
};

export default {
  name: "App",
  components: {
    BarcodeScanner
  },
  data() {
    return {
      currentLang: localStorage.getItem(LANG_KEY) || "el",
      latestScan: null,
      scans: [],
      copied: false,
      isScannerActive: false,
      searchQuery: "",
      toastMessage: "",
      toastTimer: null
    };
  },
  computed: {
    uniqueCount() {
      const uniqueTexts = new Set(this.scans.map(s => s.text));
      return uniqueTexts.size;
    },
    filteredScans() {
      if (!this.searchQuery.trim()) return this.scans;
      const q = this.searchQuery.toLowerCase();
      return this.scans.filter(s => 
        (s.text && s.text.toLowerCase().includes(q)) ||
        (s.formatName && s.formatName.toLowerCase().includes(q)) ||
        (s.parsed?.type && s.parsed.type.toLowerCase().includes(q))
      );
    }
  },
  created() {
    this.loadHistoryFromStorage();
  },
  methods: {
    t(key) {
      return (translations[this.currentLang] && translations[this.currentLang][key]) || key;
    },

    toggleLanguage() {
      this.currentLang = this.currentLang === "el" ? "en" : "el";
      localStorage.setItem(LANG_KEY, this.currentLang);
    },

    showToast(msg) {
      this.toastMessage = msg;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastMessage = "";
      }, 2200);
    },

    loadHistoryFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.scans = parsed;
            if (this.scans.length > 0) {
              this.latestScan = this.scans[0];
            }
          }
        }
      } catch (e) {
        console.warn("Could not read scan history from localStorage", e);
      }
    },

    saveHistoryToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scans));
      } catch (e) {
        console.warn("Could not save history to localStorage", e);
      }
    },

    getTypeIcon(type) {
      switch (type) {
        case 'wifi': return '📶';
        case 'vcard': return '👤';
        case 'url': return '🔗';
        case 'email': return '✉️';
        case 'tel': return '📞';
        case 'sms': return '💬';
        case 'geo': return '🗺️';
        case 'product': return '🏷️';
        default: return '📄';
      }
    },

    onBarcodeDetected(payload) {
      // Throttle exact duplicates within 1.2 seconds
      if (this.latestScan && this.latestScan.text === payload.text && (Date.now() - this.latestScan.time) < 1200) {
        return;
      }

      let formatName = "QR_CODE";
      if (payload.result) {
        if (payload.result.result?.format?.formatName) {
          formatName = payload.result.result.format.formatName;
        } else if (payload.result.format) {
          formatName = typeof payload.result.format === "string" ? payload.result.format : "Barcode";
        }
      }

      const parsedData = parseScanResult(payload.text, formatName);

      const scanEntry = {
        text: payload.text,
        formatName: formatName,
        parsed: parsedData,
        time: Date.now(),
        timeFormatted: new Date().toLocaleTimeString()
      };

      this.latestScan = scanEntry;
      this.scans.unshift(scanEntry);

      if (this.scans.length > 100) {
        this.scans.pop();
      }

      this.saveHistoryToStorage();
    },

    async copyToClipboard(text, customToast) {
      try {
        await navigator.clipboard.writeText(text);
        this.copied = true;
        this.showToast(customToast || this.t('copied'));
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
    },

    downloadVcf(item) {
      const vcardText = item.parsed.raw || item.text;
      const blob = new Blob([vcardText], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.parsed.name || 'contact'}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast(this.t('saveContact'));
    },

    exportCSV() {
      exportToCSV(this.scans, `scans_${new Date().toISOString().slice(0, 10)}.csv`);
      this.showToast(this.t('csvExportSuccess'));
    },

    exportJSON() {
      exportToJSON(this.scans, `scans_${new Date().toISOString().slice(0, 10)}.json`);
      this.showToast(this.t('jsonExportSuccess'));
    },

    removeScan(item) {
      this.scans = this.scans.filter(s => s !== item);
      if (this.latestScan === item) {
        this.latestScan = this.scans.length > 0 ? this.scans[0] : null;
      }
      this.saveHistoryToStorage();
    },

    clearHistory() {
      this.scans = [];
      this.latestScan = null;
      this.saveHistoryToStorage();
    }
  }
};
</script>

<style scoped>
.app-container {
  max-width: 520px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 2rem;
}

h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.2;
}

.version-tag {
  font-size: 0.68rem;
  background: rgba(59, 130, 246, 0.25);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
  vertical-align: middle;
  font-weight: 600;
  margin-left: 4px;
}

.subtitle {
  font-size: 0.72rem;
  color: #94a3b8;
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-lang {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-lang:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #38bdf8;
}

.header-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.unique-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.status-badge.live {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.3);
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.live .dot {
  box-shadow: 0 0 6px #4ade80;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-type-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
}

.format-tag {
  font-size: 0.7rem;
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
}

.result-card {
  border-color: rgba(56, 189, 248, 0.3);
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
}

.parsed-content-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

/* WiFi Box */
.wifi-box {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wifi-field {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.wifi-field .label {
  color: #94a3b8;
}

.wifi-field .value {
  color: #38bdf8;
}

.value-code {
  background: #020617;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4ade80;
  font-family: monospace;
}

/* vCard Box */
.vcard-box {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vcard-name {
  font-weight: 700;
  font-size: 1rem;
  color: #e2e8f0;
}

.vcard-field {
  font-size: 0.85rem;
  color: #cbd5e1;
}

/* Product Box */
.product-box {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-code {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fbbf24;
  font-family: monospace;
}

.product-hint {
  font-size: 0.72rem;
  color: #94a3b8;
}

.payload-box {
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
  word-break: break-all;
}

.payload-box code {
  color: #38bdf8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.88rem;
}

.result-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  transition: all 0.2s;
}

.btn-outline {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-outline:hover { background: rgba(255, 255, 255, 0.12); }

.btn-action { background: #10b981; color: white; }
.btn-action:hover { background: #059669; }

.btn-wifi { background: #6366f1; }
.btn-wifi:hover { background: #4f46e5; }

.btn-phone { background: #0ea5e9; }
.btn-email { background: #8b5cf6; }
.btn-maps { background: #f97316; }
.btn-product { background: #f59e0b; color: #1e293b; font-weight: 700; }

/* History Section */
.history-card {
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.history-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 0.72rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-danger-link {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 4px;
}

.btn-danger-link:hover {
  color: #ef4444;
}

.history-search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 0.8rem;
  color: #64748b;
}

.search-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 32px 8px 30px;
  color: #f8fafc;
  font-size: 0.82rem;
  outline: none;
}

.search-input:focus {
  border-color: #38bdf8;
}

.btn-clear-search {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.history-list {
  list-style: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.history-item {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s;
}

.history-item:hover {
  border-color: rgba(56, 189, 248, 0.3);
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-pill {
  font-size: 0.65rem;
  background: rgba(255, 255, 255, 0.08);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: capitalize;
}

.format-badge {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  font-size: 0.65rem;
  color: #64748b;
}

.btn-icon {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
}

.btn-icon:hover { color: #f8fafc; }
.delete-icon:hover { color: #ef4444; }

.history-text {
  font-size: 0.82rem;
  color: #cbd5e1;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  cursor: pointer;
}

/* Toast */
.app-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #2563eb;
  color: white;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  pointer-events: none;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter {
  opacity: 0;
  transform: translate(-50%, 15px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -15px);
}
</style>
