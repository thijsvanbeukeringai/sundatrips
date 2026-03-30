'use client'

import { Palmtree, Instagram, Facebook, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()

  const linkGroups = [
    {
      heading: t.footer.explore,
      items: ['Lombok', 'Bali', 'Gili Islands', 'Rinjani', 'Ubud'],
    },
    {
      heading: t.footer.platform,
      items: [t.footer.howItWorks, t.footer.forOwners, t.footer.pricing],
    },
    {
      heading: t.footer.company,
      items: [t.footer.aboutUs, t.footer.press, t.footer.blog, t.footer.careers],
    },
    {
      heading: t.footer.support,
      items: [t.footer.helpCenter, t.footer.contact, t.footer.privacy, t.footer.terms],
    },
  ]

  return (
    <footer className="bg-jungle-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-sunset-500 rounded-xl flex items-center justify-center">
                <Palmtree className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Sunda Trips</span>
            </div>
            <p className="text-jungle-100/50 text-sm leading-relaxed mb-6">
              {t.footer.tagline}
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-white/5 hover:bg-sunset-500 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4 text-white/70" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {linkGroups.map((group) => (
            <div key={group.heading}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4">{group.heading}</p>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Sunda Trips. {t.footer.copyright}
          </p>
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <span>🇮🇩</span>
            <span>{t.footer.madeWith}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
