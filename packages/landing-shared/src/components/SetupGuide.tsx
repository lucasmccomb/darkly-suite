import { useState } from 'react'
import { Mail, Table2, FileText, AlertTriangle, ExternalLink } from 'lucide-react'

type TabId = 'gmail' | 'sheets' | 'docs'

interface SetupGuideProps {
  activeTab?: string | null
  storeUrls: Record<string, string>
  products?: TabId[]
}

const TABS: { id: TabId; label: string; icon: typeof Mail; color: string }[] = [
  { id: 'gmail', label: 'Gmail', icon: Mail, color: '#ea4335' },
  { id: 'sheets', label: 'Sheets', icon: Table2, color: '#81c995' },
  { id: 'docs', label: 'Docs', icon: FileText, color: '#4285f4' },
]

function isTabId(value: string | null | undefined): value is TabId {
  return value === 'gmail' || value === 'sheets' || value === 'docs'
}

export function SetupGuide({ activeTab, storeUrls, products }: SetupGuideProps) {
  const visibleTabs = products ? TABS.filter((t) => products.includes(t.id)) : TABS
  const initialTab: TabId = isTabId(activeTab) ? activeTab : visibleTabs[0]?.id ?? 'gmail'
  const [tab, setTab] = useState<TabId>(initialTab)

  return (
    <div className="setup-guide">
      {visibleTabs.length > 1 && (
        <div className="setup-tabs">
          {visibleTabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                className={`setup-tab ${tab === t.id ? 'setup-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
                type="button"
              >
                <Icon size={18} color={tab === t.id ? t.color : undefined} strokeWidth={1.8} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="setup-content">
        {tab === 'gmail' && <GmailGuide storeUrls={storeUrls} />}
        {tab === 'sheets' && <SheetsGuide storeUrls={storeUrls} />}
        {tab === 'docs' && <DocsGuide storeUrls={storeUrls} />}
      </div>
    </div>
  )
}

function GmailGuide({ storeUrls }: { storeUrls: Record<string, string> }) {
  return (
    <div className="setup-steps">
      <Step number={1} title="Install the extension">
        <p>
          Install Darkly for Gmail (or Darkly Suite) from the{' '}
          <a href={storeUrls.gmail} target="_blank" rel="noopener noreferrer">
            Chrome Web Store
          </a>
          . After installing, you may need to refresh any open Gmail tabs.
        </p>
      </Step>

      <Step number={2} title="Choose a plan">
        <p>
          Darkly for Gmail requires a subscription to activate. Open the extension in Gmail
          and choose from Monthly, Yearly, or Lifetime plans. You can also subscribe from
          the{' '}
          <a href="/#pricing">pricing section</a>
          {' '}on this site.
        </p>
      </Step>

      <Step number={3} title="Open Gmail">
        <p>
          Navigate to{' '}
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
            mail.google.com
            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          {' '}in Chrome. You should see the Darkly icon appear in Gmail&apos;s toolbar.
        </p>
      </Step>

      <Step number={4} title="Set Gmail's theme to Default">
        <div className="setup-callout">
          <div className="setup-callout-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="setup-callout-body">
            <strong>Important for best results</strong>
            <p>
              Darkly applies dark mode by inverting Gmail&apos;s colors using a CSS filter. This
              works best when Gmail is using its default (light) theme. If you have a custom or dark
              Gmail theme, the inversion can produce incorrect colors or visual artifacts.
            </p>
            <div className="setup-callout-steps">
              <span>To set the default theme:</span>
              <ol>
                <li>Click the <strong>Settings gear</strong> icon in Gmail (top-right)</li>
                <li>Under &quot;Theme,&quot; click <strong>View all</strong></li>
                <li>Select the <strong>Default</strong> theme (first option, plain white)</li>
                <li>Click <strong>Save</strong></li>
              </ol>
            </div>
            <p className="setup-callout-note">
              Once set, Darkly handles all the dark mode styling — you won&apos;t see the plain
              white theme because Darkly inverts it into a comfortable dark palette.
            </p>
          </div>
        </div>
      </Step>

      <Step number={5} title="Toggle dark mode">
        <p>
          Click the <strong>Darkly icon</strong> in Gmail&apos;s toolbar. The mini control panel
          lets you toggle dark mode on or off instantly. You can also use the keyboard shortcut
          to toggle.
        </p>
      </Step>

      <Step number={6} title="Choose your preferred mode">
        <p>
          Open the full settings panel by clicking the Darkly icon in the Gmail sidebar (right side).
          Choose from:
        </p>
        <ul className="setup-mode-list">
          <li><strong>Dark</strong> — always on</li>
          <li><strong>System</strong> — follows your OS dark mode setting</li>
          <li><strong>Schedule</strong> — dark mode on a daily time range</li>
          <li><strong>Sunrise/Sunset</strong> — automatic based on your location</li>
        </ul>
      </Step>

      <Step number={7} title="You're all set">
        <p>
          Darkly remembers your settings across sessions. Head to{' '}
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
            Gmail
            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          {' '}and enjoy the dark mode experience.
        </p>
      </Step>
    </div>
  )
}

function SheetsGuide({ storeUrls }: { storeUrls: Record<string, string> }) {
  return (
    <div className="setup-steps">
      <Step number={1} title="Install the extension">
        <p>
          Install Darkly for Sheets (or Darkly Suite) from the{' '}
          <a href={storeUrls.sheets} target="_blank" rel="noopener noreferrer">
            Chrome Web Store
          </a>
          . After installing, refresh any open Sheets tabs.
        </p>
      </Step>

      <Step number={2} title="Open a spreadsheet">
        <p>
          Navigate to{' '}
          <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer">
            Google Sheets
            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          {' '}and open any spreadsheet. The Darkly icon will appear in the Sheets toolbar.
        </p>
      </Step>

      <Step number={3} title="Toggle dark mode">
        <p>
          Click the <strong>Darkly icon</strong> in the toolbar to open the mini control panel. Toggle dark mode
          on to see your spreadsheet transform.
        </p>
      </Step>

      <Step number={4} title="Configure your settings">
        <p>
          Click the settings gear in the mini panel (or the sidebar icon) to open the full
          settings panel. Choose your preferred mode: Dark, System, Schedule, or Sunrise/Sunset.
        </p>
      </Step>

      <Step number={5} title="Preserve Grid Colors">
        <div className="setup-callout setup-callout--tip">
          <div className="setup-callout-icon">
            <Table2 size={20} />
          </div>
          <div className="setup-callout-body">
            <strong>Tip: Colored spreadsheets</strong>
            <p>
              If your spreadsheet uses colored cells, backgrounds, or conditional formatting,
              enable <strong>Preserve Grid Colors</strong> in the settings panel. This keeps your
              cell colors intact while applying dark mode to the UI around them.
            </p>
          </div>
        </div>
      </Step>

      <Step number={6} title="You're all set">
        <p>
          Your settings are saved automatically. Head to{' '}
          <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer">
            Google Sheets
            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          {' '}and enjoy dark mode.
        </p>
      </Step>
    </div>
  )
}

function DocsGuide({ storeUrls }: { storeUrls: Record<string, string> }) {
  return (
    <div className="setup-steps">
      <Step number={1} title="Install the extension">
        <p>
          Install Darkly for Docs (or Darkly Suite) from the{' '}
          <a href={storeUrls.docs} target="_blank" rel="noopener noreferrer">
            Chrome Web Store
          </a>
          . After installing, refresh any open Docs tabs.
        </p>
      </Step>

      <Step number={2} title="Open a document">
        <p>
          Navigate to{' '}
          <a href="https://docs.google.com" target="_blank" rel="noopener noreferrer">
            Google Docs
            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          {' '}and open any document. The Darkly icon will appear in the Docs toolbar.
        </p>
      </Step>

      <Step number={3} title="Toggle dark mode">
        <p>
          Click the <strong>Darkly icon</strong> in the toolbar to open the mini control panel.
          Toggle dark mode on to see your document transform with comfortable dark styling.
        </p>
      </Step>

      <Step number={4} title="Configure your settings">
        <p>
          Open the full settings panel from the sidebar to choose your preferred mode:
          Dark, System, Schedule, or Sunrise/Sunset.
        </p>
      </Step>

      <Step number={5} title="You're all set">
        <p>
          Your settings are saved automatically. Head to{' '}
          <a href="https://docs.google.com" target="_blank" rel="noopener noreferrer">
            Google Docs
            <ExternalLink size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          {' '}and enjoy dark mode.
        </p>
      </Step>
    </div>
  )
}

interface StepProps {
  number: number
  title: string
  children: React.ReactNode
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="setup-step">
      <div className="setup-step-number">{number}</div>
      <div className="setup-step-body">
        <h3 className="setup-step-title">{title}</h3>
        {children}
      </div>
    </div>
  )
}
