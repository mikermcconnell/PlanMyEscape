import { useState } from 'react';
import { Flag, X } from 'lucide-react';

const REPORT_EMAIL = 'support@planmyescape.app';

const buildMailtoLink = (message: string) => {
  const subject = encodeURIComponent('PlanMyEscape content report');
  const body = encodeURIComponent(message);
  return 'mailto:' + REPORT_EMAIL + '?subject=' + subject + '&body=' + body;
};

const defaultTemplate = 'Describe what happened, include the trip name (if applicable), and share the email or username of the person you are reporting.';

const ReportContentButton = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultTemplate);

  const handleSubmit = () => {
    window.location.href = buildMailtoLink(message);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Flag className="h-4 w-4" />
        Report content
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Report content or user</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close report dialog"
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm text-gray-700">
              <p>
                Use this form to flag abusive, harmful, or policy-violating content. Our team reviews every submission within 24 hours and will remove violating content or suspend offending accounts.
              </p>
              <label className="block text-sm font-medium text-gray-900">
                Report details
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Submit report via email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportContentButton;
