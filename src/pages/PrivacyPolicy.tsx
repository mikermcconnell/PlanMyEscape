import React from 'react';

const PrivacyPolicy = () => (
  <div className="prose mx-auto dark:prose-invert">
    <h1>Privacy Policy for PlanMyEscape</h1>
    <p>Last updated: July 7, 2025</p>

    <h2>Information We Collect</h2>
    <ul>
      <li>Account information (email address, name)</li>
      <li>Trip planning data (destinations, dates, packing lists, meal plans)</li>
      <li>Location data (when you provide trip destinations)</li>
      <li>Usage analytics (how you interact with our app)</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <ul>
      <li>To provide trip planning services</li>
      <li>To save and sync your data across devices</li>
      <li>To improve our app functionality</li>
      <li>To send important account notifications</li>
    </ul>

    <h2>Data Sharing</h2>
    <ul>
      <li>We use Supabase for secure data storage</li>
      <li>We do not sell your personal information</li>
      <li>We may use anonymized usage analytics</li>
    </ul>

    <h2>Data Retention</h2>
    <p>We retain your data as long as you have an active account. You can delete your account at any time, and your personal data will be removed within 30 days.</p>

    <h2>Your Rights</h2>
    <ul>
      <li>Access your data</li>
      <li>Delete your account and data</li>
      <li>Export your trip data</li>
      <li>Opt out of non-essential communications</li>
    </ul>

    <h2>Geographic Scope</h2>
    <p>This policy is designed to comply with applicable privacy laws, including the General Data Protection Regulation (GDPR) in the EU and the California Consumer Privacy Act (CCPA) in the United States.</p>

    <h2>Contact Us</h2>
    <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@planmyescape.app" className="text-green-600 underline">support@planmyescape.app</a>.</p>
  </div>
);

export default PrivacyPolicy; 