import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items?: FAQItem[]
}

const defaultFaqs: FAQItem[] = [
  {
    question: 'What data does Darkly collect?',
    answer: 'None. Darkly stores all settings locally using Chrome\'s storage API (chrome.storage.sync). Your preferences sync across your Chrome browsers, but never pass through our servers. We have no analytics, no tracking, and no user accounts.',
  },
  {
    question: 'Does Darkly Suite cover all Google apps?',
    answer: 'The Darkly Suite bundle provides dark mode for Gmail, Google Sheets, and Google Docs. A single license covers all three apps. You can also purchase individual licenses for a single app at a lower price.',
  },
  {
    question: 'How does sunrise/sunset scheduling work?',
    answer: 'When you enable sunset scheduling, Darkly requests your approximate location (with your permission) to calculate sunrise and sunset times. Your location is only sent to the sunrise-sunset.org API and is never stored on our servers.',
  },
  {
    question: 'Does it work across multiple devices?',
    answer: 'Yes. Darkly uses Chrome\'s built-in sync storage, so your settings automatically sync across every device where you\'re signed into Chrome.',
  },
  {
    question: 'Can I switch from individual to the bundle?',
    answer: 'Yes! If you have an individual license and want to upgrade to the Suite, contact support and we\'ll apply a prorated credit toward your bundle subscription.',
  },
  {
    question: 'Does a Suite license include all future apps?',
    answer: 'Yes. If we add dark mode support for additional Google apps (like Drive), Suite license holders will get access automatically at no additional cost.',
  },
]

export function FAQ({ items = defaultFaqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="section">
      <div className="container">
        <div className="faq-header">
          <span className="section-label">FAQ</span>
          <h2 className="section-title">Common questions</h2>
          <p className="section-subtitle">
            Everything you need to know about Darkly.
          </p>
        </div>
        <div className="faq-list">
          {items.map((faq, index) => (
            <div
              key={faq.question}
              className={`faq-item ${openIndex === index ? 'faq-item--open' : ''}`}
            >
              <button className="faq-question" onClick={() => toggle(index)}>
                <span>{faq.question}</span>
                <ChevronDown size={20} className="faq-chevron" />
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
