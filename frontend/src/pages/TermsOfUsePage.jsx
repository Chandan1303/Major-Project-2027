import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

export default function TermsOfUsePage() {
  return (
    <AuthLayout compact>
      <div className="legal-content">
        <Link to="/login" className="back-link">← Back to Login</Link>
        
        <h2>Terms of Use</h2>
        
        <div className="legal-text">
          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using this Agricultural Decision Support System, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily access the materials (information or software) on our Agricultural Intelligence System for personal, non-commercial transitory viewing only.
            </p>
            <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the system</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h3>3. Data Accuracy</h3>
            <p>
              The materials on our system are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p>
              The AI-powered predictions and forecasts are based on machine learning models and should be used as decision support tools only. Users should consult with agricultural experts before making critical farming decisions.
            </p>
          </section>

          <section>
            <h3>4. Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.
            </p>
          </section>

          <section>
            <h3>5. Limitations</h3>
            <p>
              In no event shall NIE or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our system.
            </p>
          </section>

          <section>
            <h3>6. Revisions</h3>
            <p>
              The materials appearing on our system could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our system are accurate, complete, or current. We may make changes to the materials contained on our system at any time without notice.
            </p>
          </section>

          <section>
            <h3>7. Contact</h3>
            <p>
              If you have any questions about these Terms of Use, please contact us at support@agri-intelligence.edu
            </p>
          </section>

          <p className="legal-footer">
            Last updated: January 2024
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
