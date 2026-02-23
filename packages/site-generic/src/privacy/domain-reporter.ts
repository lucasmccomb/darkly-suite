/**
 * Privacy-Safe Domain Reporting
 *
 * Allows users to report sites where dark mode doesn't look right.
 * Domain names are hashed (SHA-256) before storage or transmission
 * so that the full browsing domain is never exposed.
 *
 * Reports are stored locally and can optionally be synced (hashed).
 */

export interface DomainReport {
  /** SHA-256 hash of the domain. */
  domainHash: string;
  /** Type of issue. */
  issueType: 'broken' | 'already-dark' | 'partial';
  /** User-provided description (optional). */
  description?: string;
  /** Timestamp. */
  timestamp: number;
}

/** Hash a domain name using SHA-256 for privacy. */
export async function hashDomain(domain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(domain.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const REPORTS_KEY = 'bd_domain_reports';

/** Store a domain report locally. */
export async function reportDomain(
  domain: string,
  issueType: DomainReport['issueType'],
  description?: string,
): Promise<void> {
  const domainHash = await hashDomain(domain);
  const report: DomainReport = {
    domainHash,
    issueType,
    description,
    timestamp: Date.now(),
  };

  const result = await chrome.storage.local.get(REPORTS_KEY);
  const reports: DomainReport[] = result[REPORTS_KEY] || [];

  // Replace existing report for same domain, or add new
  const existingIdx = reports.findIndex((r) => r.domainHash === domainHash);
  if (existingIdx >= 0) {
    reports[existingIdx] = report;
  } else {
    reports.push(report);
  }

  // Keep max 100 reports
  if (reports.length > 100) {
    reports.splice(0, reports.length - 100);
  }

  await chrome.storage.local.set({ [REPORTS_KEY]: reports });
}

/** Get all stored reports. */
export async function getReports(): Promise<DomainReport[]> {
  const result = await chrome.storage.local.get(REPORTS_KEY);
  return result[REPORTS_KEY] || [];
}

/** Clear all stored reports. */
export async function clearReports(): Promise<void> {
  await chrome.storage.local.remove(REPORTS_KEY);
}
