# Quoted component props do not decode HTML character references

With Astro 7.4.2 and `@astrojs/compiler-rs@0.5.2`, a plain `.astro` component displays character-reference text literally when it is passed through a quoted prop:

```astro
<Label label={'Tom & Jerry'} />
<Label label="Tom &amp; Jerry" />
```

Both should display `Tom & Jerry`. The second displays `Tom &amp; Jerry`.

## Reproduction

[Runnable reproduction](https://github.com/jp-knj/astro-compiler-entity-props-repro)

```sh
git clone https://github.com/jp-knj/astro-compiler-entity-props-repro.git
cd astro-compiler-entity-props-repro
npm ci
npm run repro
```

The command runs `astro build`, which succeeds, then checks the generated HTML. The check exits with status 1 on the affected version.

`src/components/Label.astro`:

```astro
---
const { id, label } = Astro.props;
---
<p id={id}>{label}</p>
```

The output for the two values above is:

```html
<p id="amp-control">Tom &amp; Jerry</p>
<p id="amp-entity">Tom &amp;amp; Jerry</p>
```

The repro also checks `&#65;&#x1F600;`, `&quot;Hello&quot;`, and `&amp;amp;` against JavaScript string controls. The last case expects exactly one level of decoding: `&amp;amp;` should become the value `&amp;`, rather than `&`.

## Compiler evidence

The generated component-prop value for `label="Tom &amp; Jerry"` is `"Tom &amp; Jerry"`. The Go compiler 2.13.1 instead emits `"Tom & Jerry"`. This is a comparison of generated prop values, not a full Astro 6 build comparison.

The [quoted-prop path in compiler-rs main at `5627e84`](https://github.com/withastro/compiler-rs/blob/5627e84dad90d02809d27c9702aab9351b257781/crates/astro_codegen/src/printer/components.rs#L681-L689) applies JavaScript string escaping to the attribute value without decoding HTML character references. The main commit was inspected but not built for this report.

This is separate from [Astro #18070](https://github.com/withastro/astro/issues/18070) / [#18086](https://github.com/withastro/astro/pull/18086), whose fix decodes the `__ASTRO_IMAGE_` round-trip in Markdown image handling. This reproduction has no Markdown or images. It also differs from [compiler-rs #89](https://github.com/withastro/compiler-rs/issues/89), which concerns JavaScript backslash escapes.

## Environment

- Astro: 7.4.2
- `@astrojs/compiler-rs`: 0.5.2, pinned with an npm override
- Node: 24.8.0
- npm: 11.6.0
- macOS arm64
