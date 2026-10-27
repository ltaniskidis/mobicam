import BarcodeScanner from './components/BarcodeScanner.vue';
import { parseScanResult } from './utils/parser.js';
import { exportToCSV, exportToJSON } from './utils/export.js';

export {
  BarcodeScanner,
  parseScanResult,
  exportToCSV,
  exportToJSON
};

export default BarcodeScanner;
