'use client';

import dynamic from 'next/dynamic';
import { CmsMediaField } from '@/components/cms/cms-media-field';
import { ProductGridBlockEditor } from '@/components/cms/product-grid-block-editor';
import { DiscoveryChipsBlockEditor } from '@/components/cms/discovery-chips-block-editor';
import {
  EMPTY_PROPS,
  HERO_LAYOUTS,
  HERO_LAYOUT_LABELS,
  CUSTOM_SECTION_LAYOUTS,
  CUSTOM_SECTION_LAYOUT_LABELS,
  blockLabel,
  fieldLabel,
  heroVisibleKeys,
  customVisibleKeys,
  parseHeroLayout,
  parseCustomSectionLayout,
  type Block,
  type BlockType,
} from './cms-page-model';
import { CmsSectionStyleFields } from './cms-section-style-fields';
import {
  INSPECTOR_GROUP_ORDER,
  INSPECTOR_GROUP_TITLE,
  INSPECTOR_INPUT,
  INSPECTOR_TEXTAREA,
  INSPECTOR_TEXTAREA_CODE,
  INSPECTOR_TEXTAREA_SHORT,
  InspectorField,
  InspectorSection,
  inspectorFieldGroup,
} from './cms-inspector-ui';

const ArticleEditor = dynamic(
  () => import('@/components/editorial/article-editor').then((m) => ({ default: m.ArticleEditor })),
  {
    ssr: false,
    loading: () => <p className="ops-muted py-6 text-sm">Loading editor…</p>,
  },
);

type Props = {
  block: Block;
  onChange: (key: string, value: string) => void;
};

function PropField({
  blockType,
  fieldKey,
  value,
  onChange,
  editorKey,
}: {
  blockType: BlockType;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  editorKey?: string;
}) {
  const inputClass = INSPECTOR_INPUT;

  if (blockType === 'richText' && fieldKey === 'html') {
    return (
      <div className="mt-1">
        <ArticleEditor
          key={editorKey ?? 'richtext'}
          initialContent={value || '<p></p>'}
          onChange={onChange}
          placeholder="Write page copy…"
          className="text-sm"
          enableMediaLibrary
        />
      </div>
    );
  }

  if (
    blockType === 'customSection' &&
    (fieldKey === 'body' || fieldKey === 'body2' || fieldKey === 'body3')
  ) {
    return (
      <div className="mt-1">
        <ArticleEditor
          key={`${editorKey ?? 'custom'}-${fieldKey}`}
          initialContent={value || '<p></p>'}
          onChange={onChange}
          className="text-sm"
          enableMediaLibrary
        />
      </div>
    );
  }

  if (
    fieldKey === 'url' ||
    fieldKey === 'imageUrl' ||
    fieldKey === 'imageUrl2' ||
    fieldKey === 'imageUrl3' ||
    fieldKey === 'bgImageUrl' ||
    fieldKey === 'leftImageUrl' ||
    fieldKey === 'rightImageUrl'
  ) {
    return (
      <CmsMediaField
        value={value}
        onChange={onChange}
        allowVideo={
          (blockType === 'hero' || blockType === 'customSection') &&
          (fieldKey === 'imageUrl' ||
            fieldKey === 'imageUrl2' ||
            fieldKey === 'imageUrl3' ||
            fieldKey === 'bgImageUrl')
        }
      />
    );
  }

  if (
    fieldKey === 'subcopy' ||
    fieldKey === 'subcopy2' ||
    fieldKey === 'subtitle' ||
    ((fieldKey === 'body' || fieldKey === 'body2' || fieldKey === 'body3') &&
      blockType !== 'customSection')
  ) {
    return (
      <textarea
        className={INSPECTOR_TEXTAREA}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (fieldKey === 'trustLine' || fieldKey === 'productSlugs') {
    return (
      <textarea
        className={INSPECTOR_TEXTAREA_SHORT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={fieldKey === 'trustLine' ? 'Chip A · Chip B · Chip C' : 'one, two, three'}
      />
    );
  }

  if (
    fieldKey === 'html' ||
    fieldKey === 'brands' ||
    fieldKey === 'usps' ||
    fieldKey === 'shopLinks' ||
    fieldKey === 'companyLinks' ||
    fieldKey === 'items' ||
    fieldKey === 'steps' ||
    fieldKey === 'itemsJson' ||
    fieldKey === 'cardsJson'
  ) {
    return (
      <textarea
        className={INSPECTOR_TEXTAREA_CODE}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          fieldKey === 'brands'
            ? 'Name | /gift/brands/x.svg, …'
            : fieldKey === 'usps'
              ? 'gift:Personalised gifts|Baby name & wrap, shield:Trusted quality|Baby-safe'
              : fieldKey === 'shopLinks' || fieldKey === 'companyLinks'
                ? 'Label | /path (one per line)'
                : fieldKey === 'items'
                  ? 'Label | /href | /image.jpg | Alt (one per line)'
                  : fieldKey === 'steps'
                    ? 'Title | Body (one per line)'
                    : fieldKey === 'itemsJson'
                      ? '[{"quote":"…","author":"…","role":"…","rating":5}] or FAQ [{question,answerHtml}]'
                      : fieldKey === 'cardsJson'
                        ? '[{"tag":"…","title":"Save 10%","ctaLabel":"…","ctaHref":"/gift","tone":"blush"}]'
                        : undefined
        }
      />
    );
  }

  if (fieldKey === 'size') {
    return (
      <select
        className={inputClass}
        value={value || 'md'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    );
  }

  if (fieldKey === 'tone' && blockType === 'saleStrip') {
    return (
      <select
        className={inputClass}
        value={value || 'blush'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="blush">Blush</option>
        <option value="mint">Mint</option>
        <option value="sky">Sky</option>
        <option value="soft">Soft</option>
      </select>
    );
  }

  if (fieldKey === 'imageFit' && blockType === 'buildYourBoxTeaser') {
    return (
      <select
        className={inputClass}
        value={value || 'contain'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="contain">Contain</option>
        <option value="cover">Cover</option>
      </select>
    );
  }

  if (fieldKey === 'hamper' || fieldKey === 'showUsps') {
    return (
      <select
        className={inputClass}
        value={value === 'true' ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    );
  }

  if (fieldKey === 'leftAccent' || fieldKey === 'rightAccent') {
    return (
      <select
        className={inputClass}
        value={value === 'sky' ? 'sky' : 'pink'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="pink">Pink</option>
        <option value="sky">Sky</option>
      </select>
    );
  }

  if (fieldKey === 'layout' && blockType === 'hero') {
    return (
      <select
        className={inputClass}
        value={value || 'splitCopyMedia'}
        onChange={(e) => onChange(e.target.value)}
      >
        {HERO_LAYOUTS.map((layout) => (
          <option key={layout} value={layout}>
            {HERO_LAYOUT_LABELS[layout]}
          </option>
        ))}
      </select>
    );
  }

  if (fieldKey === 'layout' && blockType === 'customSection') {
    return (
      <select
        className={inputClass}
        value={value || 'stack'}
        onChange={(e) => onChange(e.target.value)}
      >
        {CUSTOM_SECTION_LAYOUTS.map((layout) => (
          <option key={layout} value={layout}>
            {CUSTOM_SECTION_LAYOUT_LABELS[layout]}
          </option>
        ))}
      </select>
    );
  }

  if (fieldKey === 'bg' && blockType === 'customSection') {
    return (
      <select
        className={inputClass}
        value={value || 'default'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="default">Default</option>
        <option value="surface">Surface</option>
        <option value="blush">Blush</option>
        <option value="mint">Mint</option>
        <option value="sky">Sky</option>
        <option value="lavender">Lavender</option>
        <option value="soft">Soft</option>
      </select>
    );
  }

  if (fieldKey === 'width' && blockType === 'customSection') {
    return (
      <select
        className={inputClass}
        value={value || 'page'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="page">Page</option>
        <option value="narrow">Narrow</option>
        <option value="full">Full</option>
      </select>
    );
  }

  if (fieldKey === 'minHeight' && blockType === 'customSection') {
    return (
      <select
        className={inputClass}
        value={value || 'auto'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="auto">Auto</option>
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    );
  }

  if (fieldKey === 'radius' && blockType === 'customSection') {
    return (
      <select
        className={inputClass}
        value={value || 'none'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="none">Square</option>
        <option value="control">Rounded</option>
        <option value="clay">Soft</option>
      </select>
    );
  }

  if (fieldKey === 'variant') {
    if (blockType === 'hero') {
      return (
        <select
          className={inputClass}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Default</option>
          <option value="storefront">Storefront</option>
          <option value="panel">Panel</option>
        </select>
      );
    }
    return (
      <select
        className={inputClass}
        value={value || 'primary'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="primary">Primary</option>
        <option value="secondary">Secondary</option>
      </select>
    );
  }

  return <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function CmsBlockInspector({ block, onChange }: Props) {
  const keys =
    block.type === 'hero'
      ? heroVisibleKeys(parseHeroLayout(block.props.layout))
      : block.type === 'customSection'
        ? customVisibleKeys(parseCustomSectionLayout(block.props.layout))
        : Object.keys(EMPTY_PROPS[block.type]);
  const heroLayout = block.type === 'hero' ? parseHeroLayout(block.props.layout) : undefined;
  const customLayout =
    block.type === 'customSection' ? parseCustomSectionLayout(block.props.layout) : undefined;

  const grouped = INSPECTOR_GROUP_ORDER.map((id) => ({
    id,
    title: INSPECTOR_GROUP_TITLE[id],
    keys: keys.filter((key) => inspectorFieldGroup(key) === id),
  })).filter((g) => g.keys.length > 0);

  function renderKey(key: string) {
    const label =
      (block.type === 'hero' || block.type === 'customSection') &&
      (key === 'imageUrl' || key === 'imageUrl2' || key === 'imageUrl3' || key === 'bgImageUrl')
        ? key === 'bgImageUrl'
          ? 'Background media'
          : key === 'imageUrl2'
            ? 'Second image or video'
            : key === 'imageUrl3'
              ? 'Third image or video'
              : 'Image or video'
        : fieldLabel(key);
    return (
      <InspectorField key={key} label={label}>
        <PropField
          blockType={block.type}
          fieldKey={key}
          value={block.props[key] ?? ''}
          onChange={(v) => onChange(key, v)}
          editorKey={block.clientId}
        />
      </InspectorField>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="px-0.5 text-sm font-medium">{blockLabel(block.type, block.props.layout)}</p>
      {block.type === 'productGrid' ? (
        <InspectorSection title="Content">
          <ProductGridBlockEditor props={block.props} onChange={onChange} />
        </InspectorSection>
      ) : block.type === 'discoveryChips' ? (
        <InspectorSection title="Content">
          <DiscoveryChipsBlockEditor props={block.props} onChange={onChange} />
        </InspectorSection>
      ) : (
        grouped.map((group) => (
          <InspectorSection key={group.id} title={group.title}>
            {group.keys.map(renderKey)}
          </InspectorSection>
        ))
      )}
      {block.type === 'spacer' ? null : (
        <InspectorSection title="Style">
          <CmsSectionStyleFields
            values={block.props}
            onChange={onChange}
            showValign={
              block.type === 'hero' ||
              customLayout === 'bleed' ||
              customLayout === 'split' ||
              customLayout === 'splitReverse'
            }
            showHeadlineSize={block.type !== 'image' && block.type !== 'richText'}
            showOverlay={heroLayout === 'full' || customLayout === 'bleed'}
          />
        </InspectorSection>
      )}
    </div>
  );
}
