import { getTrips, getGear } from '../utils/storage';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { logSecurityEvent } from '../utils/securityLogger';

const DataExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportUserData = async () => {
    try {
      setExporting(true);
      const [trips, gear] = await Promise.all([getTrips(), getGear()]);

      const userData = {
        trips,
        gear,
        exportDate: new Date().toISOString(),
        format: 'JSON'
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planmyescape-data.json';
      a.click();
      URL.revokeObjectURL(url);

      // Log event
      await logSecurityEvent({ type: 'data_export', userAgent: navigator.userAgent });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={exportUserData}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
      disabled={exporting}
    >
      <Download className="h-4 w-4" />
      {exporting ? 'Exporting…' : 'Export My Data'}
    </button>
  );
};

export default DataExport; 