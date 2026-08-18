'use client';

import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { WhatsAppIcon } from '@/components/gift/whatsapp-icon';

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  countryCode?: string;
  placeholder?: string;
  ctaLabel?: string;
  disclaimer?: string;
};

export function WhatsappCtaBlock({
  eyebrow = 'Early access',
  title,
  body,
  countryCode = '+91',
  placeholder = 'Enter WhatsApp number',
  ctaLabel = 'Get early access',
  disclaimer,
}: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid WhatsApp number');
      return;
    }
    setError('');
    setDone(true);
  }

  return (
    <section className="gift-whatsapp-cta" data-testid="whatsapp-cta">
      <div className="gift-whatsapp-cta__glow" aria-hidden />
      <div className="gift-whatsapp-cta__inner">
        <div className="gift-whatsapp-cta__copy">
          <span className="gift-whatsapp-cta__mark" aria-hidden>
            <WhatsAppIcon />
          </span>
          {eyebrow ? (
            <span className="gift-whatsapp-cta__tag">
              <Sparkles className="h-3 w-3" aria-hidden />
              {eyebrow}
            </span>
          ) : null}
          <h2 className="gift-whatsapp-cta__title">{title}</h2>
          {body ? <p className="gift-whatsapp-cta__body">{body}</p> : null}
        </div>
        <div className="gift-whatsapp-cta__card">
          {done ? (
            <p className="gift-whatsapp-cta__thanks">You are on the list.</p>
          ) : (
            <form className="gift-whatsapp-cta__form" onSubmit={onSubmit}>
              <div className="gift-whatsapp-cta__phone">
                <span className="gift-whatsapp-cta__cc" aria-hidden>
                  {countryCode}
                </span>
                <input
                  className="gift-whatsapp-cta__input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder={placeholder}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  aria-label={placeholder}
                  aria-invalid={error ? true : undefined}
                />
              </div>
              <button type="submit" className="clay-btn gift-whatsapp-cta__btn">
                <WhatsAppIcon className="h-4 w-4" />
                {ctaLabel}
              </button>
            </form>
          )}
          {error ? <p className="gift-whatsapp-cta__err">{error}</p> : null}
          {disclaimer ? <p className="gift-whatsapp-cta__disclaimer">{disclaimer}</p> : null}
        </div>
      </div>
    </section>
  );
}
