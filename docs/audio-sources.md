# Audio Sources

SPEC §12.2, decision D3 (issue #3). Reviewed 2026-08-15.

## Current source

**Al Quran Cloud / Islamic Network CDN** — the same project that supplies the
bundled Quran text, so the app already depends on and attributes them.

| | |
| --- | --- |
| Reciter | Mahmoud Khalil Al-Husary, murattal (`ar.husary`) |
| URL | `https://cdn.islamic.network/quran/audio/128/ar.husary/{n}.mp3` |
| Addressing | `{n}` is mushaf position, 1..6236 — **not** surah/ayah |
| Bitrates published | 192, 128, 64, 48, 40, 32 kbps |
| Editions available | 188, including Husary Mujawwad, Minshawi, Alafasy |

Mushaf position is derived in `src/audio/sources.ts` by cumulative sum over
`ayahCount` in `src/content/structure.json`, and covered by
`tests/unit/audio-sources.test.ts`, which enumerates all 6,236 ayahs.

Verified against the live CDN: ayah 1 → 200, 6236 → 200, 6237 → 403, and
2:255 (position 262) returns 971 KB against ~83 KB for a short verse —
consistent with Ayat al-Kursi, so the numbering aligns on content, not just
on endpoints.

## Terms

From [alquran.cloud/terms-and-conditions](https://alquran.cloud/terms-and-conditions),
section IV, verbatim:

> Recitations are licensed to us by the reciters or their estates for free,
> non-commercial redistribution at the bitrates we publish. You may stream,
> embed and download them for personal and educational use. You may bundle
> them into a commercial product, but please note that copyrights lie with the
> reciters and they may ask you to remove the conent.

Qamar is free, MIT-licensed and educational, which sits inside that grant.

**Constraints this places on us:**

- Do not re-encode or rehost. The grant is scoped to "the bitrates we
  publish", so serve the CDN's own files and cache them unmodified.
- Attribute the reciter. Carried in `QariSource.attribution`.
- This is permission, not a free licence. Copyright remains with the reciters
  and removal can be requested, so D3 is "documented permission with a
  takedown clause", not closed permanently.
- The API/CDN applies a soft per-IP rate limit and offers no availability
  warranty. Per-ayah caching (SPEC §12.3) keeps normal use well under it.

## Why not EveryAyah (previous source)

Removed 2026-08-15. It publishes **no licence for the audio at all**:

- everyayah.com states no licence, copyright or terms for the recordings.
- Its only licensing text covers the separate *timing files*:
  `(C) VerseByVerseQuran.com — You must link back to our site... Full License
  at http://versebyversequran.com/site/license`
- That licence URL returns **404**.
- The widely repeated "EveryAyah is CC-BY-NC" claim originates from
  [quran/quran_android#434](https://github.com/quran/quran_android/issues/434),
  where a third party *asking* for clarification asserted it. No rights holder
  ever granted it. It then propagated into other projects' docs and into
  search-engine summaries.

We were also hotlinking their bandwidth without permission.

## Underlying rights

The Quran text is public domain; a *recording* carries separate performer and
producer rights. Al-Husary died 24 November 1980 and recorded for Egyptian
Radio from 1944.

| Jurisdiction | Term for sound recordings | 1960s recording |
| --- | --- | --- |
| Egypt (Law 82/2002) | 50 yrs from recording | likely expired |
| EU (Directive 2011/77) | 70 yrs if protected on 2013-11-01 | possibly into the 2030s |
| US (URAA + MMA) | restored foreign pre-1972 recordings | potentially to 2067 |

Jurisdiction-dependent and plausibly still protected where users are, so the
recordings are not treated as public domain. This is not legal advice.

## Rejected alternatives

- **Wikimedia Commons** — the only source with enforced licence verification,
  but roughly 66 files plus two reciter subcategories. No complete per-ayah
  mushaf, so unusable for hifz.
- **QUL / Tarteel** ([qul.tarteel.ai](https://qul.tarteel.ai/faq)) — a serious
  curator, but explicitly punts: licensing "varies by resource", and the
  Al-Husary resource page states no licence.
- **Archive.org mirrors** — "public domain" marks there are uploader-asserted
  and not verified.

No complete, verifiably free-licensed per-ayah recitation appears to exist.

## Switching reciter

`QariSource` in `src/audio/sources.ts` isolates this. Swapping edition means
changing the identifier (`ar.minshawi`, `ar.alafasy`, …) and the `id`, which
also keys the on-device cache directory — deliberately, so two encodings can
never share one cache.
