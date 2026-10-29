# Astro quoted component props preserve character-reference text

Astro 7.4.2 with `@astrojs/compiler-rs@0.5.2` builds this page successfully, but HTML character references inside quoted component props are displayed as literal entity text.

```astro
<Label label={'Tom & Jerry'} />
<Label label="Tom &amp; Jerry" />
```

Both should display `Tom & Jerry`. The second displays `Tom &amp; Jerry`.

## Run

Using Node 24.8.0 and npm 11.6.0:

```sh
git clone https://github.com/jp-knj/astro-compiler-entity-props-repro.git
cd astro-compiler-entity-props-repro
npm ci
npm run repro
```

The script runs a real `astro build`, then compares the generated paragraph contents. Each quoted attribute is paired with a JavaScript string expression representing the expected value. The build succeeds; the output check exits with status **1** on the affected version. A fixed compiler should make all four pairs match and exit with status **0**.

The dependency, override, and lockfile pin compiler-rs to 0.5.2 throughout the Astro dependency tree.

## Expected and actual display

`Label.astro` reads `Astro.props.label` and renders `<p>{label}</p>`.

| Quoted attribute | Expected browser text | Actual browser text |
| --- | --- | --- |
| `label="Tom &amp; Jerry"` | `Tom & Jerry` | `Tom &amp; Jerry` |
| `label="&#65;&#x1F600;"` | `A😀` | `&#65;&#x1F600;` |
| `label="&quot;Hello&quot;"` | `"Hello"` | `&quot;Hello&quot;` |
| `label="&amp;amp;"` | `&amp;` | `&amp;amp;` |

The final pair requires decoding exactly one level. It distinguishes the intended behavior from repeatedly decoding until no references remain.

For the ampersand case, `dist/index.html` contains:

```html
<p id="amp-control">Tom &amp; Jerry</p>
<p id="amp-entity">Tom &amp;amp; Jerry</p>
```

See [repro-output.txt](./repro-output.txt) for the recorded build and checks. For an application workaround, pass the intended text in a JavaScript expression as in the controls.

## Compiler evidence

At [compiler-rs main commit `5627e84`](https://github.com/withastro/compiler-rs/blob/5627e84dad90d02809d27c9702aab9351b257781/crates/astro_codegen/src/printer/components.rs#L681-L689), the quoted-prop path escapes the raw attribute string for JavaScript without decoding HTML character references. The published 0.5.2 package emits the equivalent of:

```js
{ label: "Tom &amp; Jerry" }
```

Rendering that value escapes its literal ampersand, producing `Tom &amp;amp; Jerry` in the HTML. By comparison, the Go compiler 2.13.1 emits `{ label: "Tom & Jerry" }` for the same quoted prop. That comparison checks the generated prop value; it is not a full Astro 6 build comparison.

The full build reproduction uses the published Astro and compiler-rs versions above on macOS arm64. The cited main commit has been inspected but not built. Other platforms and unrelated prop paths have not been tested.

## Existing reports checked

Issue and PR searches on 2026-10-29 across `withastro/compiler-rs`, `withastro/compiler`, and `withastro/astro` did not identify a report for this quoted component-prop path. Search terms covered entities, character references, ampersands, props, and attributes. This does not prove that it has never been reported.

- [Astro #18070](https://github.com/withastro/astro/issues/18070) and [#18086](https://github.com/withastro/astro/pull/18086) concern Markdown image properties round-tripped through `__ASTRO_IMAGE_`. That fix changes Markdown image decoding; this reproduction uses a plain `.astro` component and no Markdown or images.
- [compiler-rs #89](https://github.com/withastro/compiler-rs/issues/89) and [#134](https://github.com/withastro/compiler-rs/pull/134) concern JavaScript backslash escapes in component props, such as `\n`, rather than HTML character references.

[ISSUE.md](./ISSUE.md) contains a standalone issue draft.
