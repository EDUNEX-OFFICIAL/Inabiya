'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@/lib/auth-client';
import { GiftSelect } from '@/components/gift/gift-select';

export function CorporateInquiryForm() {
  const [type, setType] = useState<'corporate' | 'bulk'>('corporate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [estimatedQty, setEstimatedQty] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/catalog/gifting-inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: CSRF_HEADER_VALUE },
        credentials: 'include',
        body: JSON.stringify({
          type,
          fullName,
          email,
          phone: phone || undefined,
          company: company || undefined,
          message,
          estimatedQty: estimatedQty ? Number(estimatedQty) : undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(j?.error?.message ?? `Request failed (${res.status})`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="clay-panel mt-gs-6 p-gs-6 text-center sm:p-gs-6">
        <p className="gift-h2">Thanks</p>
        <p className="mt-gs-2 text-body opacity-80">We received your inquiry.</p>
        <Link href="/" className="clay-btn mt-gs-5 inline-flex">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="clay-panel mt-gs-6 space-y-gs-3 p-gs-5 text-body sm:p-gs-6"
    >
      <div className="block">
        Type
        <GiftSelect
          className="mt-gs-1"
          ariaLabel="Inquiry type"
          value={type}
          options={[
            { value: 'corporate', label: 'Corporate' },
            { value: 'bulk', label: 'Bulk / event' },
          ]}
          onChange={(v) => setType(v as 'corporate' | 'bulk')}
        />
      </div>
      <label className="block">
        Full name
        <input
          className="clay-input"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>
      <label className="block">
        Email
        <input
          className="clay-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block">
        Phone
        <input className="clay-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className="block">
        Company
        <input
          className="clay-input"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </label>
      <label className="block">
        Estimated quantity
        <input
          className="clay-input"
          inputMode="numeric"
          value={estimatedQty}
          onChange={(e) => setEstimatedQty(e.target.value)}
        />
      </label>
      <label className="block">
        Message
        <textarea
          className="clay-input min-h-[6rem]"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      {error ? <p className="text-body text-red-600">{error}</p> : null}
      <button type="submit" className="clay-btn w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Submit inquiry'}
      </button>
    </form>
  );
}
