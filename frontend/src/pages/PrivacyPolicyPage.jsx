import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

export default function PrivacyPolicyPage() {
  return (
    <AuthLayout compact>
      <div className="legal-content">
        <Link to="/login" className="back-link">← Back to Login</Link>
        
        <h2>Privacy Policy</h2>
        
        <div className="legal-text">
          <section>
            <h3>1. Information We Collect</h3>
            <p>
              We collect information that you provide directly to us when you create an account, use our services, or communicate with us. This includes:
            </p>
            <ul>
              <li>Name and email address</li>
              <li>Account credentials (encrypted passwords)</li>
              <li>Farm data and agricultural information you input</li>
              <li>Usage data and interaction with our system</li>
            </ul>
          </section>

          <section>
            <h3>2. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process your requests and provide you with AI-powered yield predictions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Analyze usage patterns to improve our machine learning models</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section>
            <h3>3. Data Security</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. This includes:
            </p>
            <ul>
              <li>Password encryption using industry-standard algorithms</li>
              <li>Secure data transmission using HTTPS</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
            </ul>
          </section>

          <section>
            <h3>4. Data Sharing and Disclosure</h3>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>In aggregated, anonymized form for research purposes</li>
            </ul>
          </section>

          <section>
            <h3>5. Satellite and Climate Data</h3>
            <p>
              Our system uses satellite NDVI data and climate information from third-party sources. This data is processed in accordance with the respective provider's terms of service and is used solely for generating agricultural insights for your benefit.
            </p>
          </section>

          <section>
            <h3>6. Your Rights</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h3>7. Cookies and Tracking</h3>
            <p>
              We use essential cookies to maintain your session and authentication state. We do not use third-party tracking cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h3>8. Data Retention</h3>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h3>9. Children's Privacy</h3>
            <p>
              Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h3>10. Changes to Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h3>11. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>Email: privacy@agri-intelligence.edu</p>
            <p>Institution: NIE Agricultural Decision Support System</p>
          </section>

          <p className="legal-footer">
            Last updated: January 2024
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
