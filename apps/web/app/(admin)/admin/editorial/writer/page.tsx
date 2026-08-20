'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl, type AuthUser } from '@/lib/auth-client';
import { ARTICLE_STATUS_LABEL } from '@/lib/editorial-nav';
import { EditorialEmpty } from '@/components/editorial/editorial-ui';
import {
  EditorialSelect,
  type EditorialSelectOption,
} from '@/components/editorial/editorial-select';

type ArticleRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

const STATUS_OPTIONS: EditorialSelectOption[] = [
  { value: '', label: 'All' },
  { value: 'ASSIGNED', label: ARTICLE_STATUS_LABEL.ASSIGNED ?? 'Assigned' },
  { value: 'DRAFT', label: ARTICLE_STATUS_LABEL.DRAFT ?? 'Draft' },
  { value: 'CHANGES_REQUESTED', label: ARTICLE_STATUS_LABEL.CHANGES_REQUESTED ?? 'Changes' },
  { value: 'APPROVED', label: ARTICLE_STATUS_LABEL.APPROVED ?? 'Approved' },
  { value: 'PUBLISHED', label: ARTICLE_STATUS_LABEL.PUBLISHED ?? 'Published' },
];

export default function WriterDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [status, setStatus] = useState('');

  const visibleRows = useMemo(
    () => (status ? rows.filter((r) => r.status === status) : rows),
    [rows, status],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial/writer'));
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        if (!u.roles.includes('WRITER')) {
          router.replace('/admin/editorial');
          return;
        }
        return apiAuth<ArticleRow[]>('/editorial/articles?mine=1');
      })
      .then((data) => {
        if (data) setRows(data);
      })
      .catch(() => router.replace(loginUrl('/admin/editorial/writer')));
  }, [router]);

  return (
    <main className="blog-page">
      <div className="editorial-page-head">
        <div>
          <p className="blog-overline">Editorial</p>
          <h1 className="blog-h1 mt-gs-2">Writer</h1>
        </div>
        <div className="editorial-page-head__filters">
          <p className="editorial-page-head__count">
            <Inbox aria-hidden />
            {visibleRows.length}
            {status ? ` / ${rows.length}` : ''}{' '}
            {rows.length === 1 ? 'assignment' : 'assignments'}
          </p>
          {rows.length > 0 ? (
            <div className="editorial-filters">
              <div className="editorial-filters__status">
                Status
                <EditorialSelect
                  variant="inline"
                  ariaLabel="Filter by article status"
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ul className="editorial-resource-list mt-gs-6">
        {visibleRows.map((a) => (
          <li key={a.id}>
            <Link href={`/admin/editorial/articles/${a.id}`} className="editorial-resource-card">
              <div className="editorial-resource-card__head">
                <div className="editorial-resource-card__id">
                  <p className="editorial-resource-card__title">{a.title}</p>
                  <p className="editorial-meta editorial-resource-card__meta">
                    <span>{ARTICLE_STATUS_LABEL[a.status] ?? a.status}</span>
                    <span>{new Date(a.updatedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {visibleRows.length === 0 ? (
          <EditorialEmpty icon={Inbox}>
            {status ? 'No assignments in this status.' : 'No assignments.'}
          </EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
