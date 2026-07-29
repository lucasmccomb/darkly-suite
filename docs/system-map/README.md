# System Map

Interactive [LikeC4](https://likec4.dev) map of the whole suite, generated from the repo at anchor commit `8816bd5`. Every element carries prose grounded in the code and source links pinned to that commit.

| File | What it is |
|------|-----------|
| `darkly-suite-map.html` | Self-contained interactive map (no external requests). Two views: the full suite (`#/view/index/`) and Darkly for Gmail (`#/view/gmail/`). |
| `darkly-suite-map.png` | Static export of the full-suite view, embedded in the root README. |
| `darkly-for-gmail-map.png` | Static export of the Gmail-focused view. |
| `model/` | LikeC4 sources (`spec.c4`, `model.c4`, `views.c4`, `likec4.config.json`). |

## Viewing

GitHub does not render the interactive HTML. Open it locally:

```bash
npx serve docs/system-map    # then open /darkly-suite-map.html
```

or view it embedded on [lem.work/projects/darkly-suite](https://lem.work/projects/darkly-suite).

## Regenerating

```bash
cd docs/system-map
npx -y likec4@1.59.2 build --output-single-file --base ./ -o out model
mv out/index.html darkly-suite-map.html
npx -y likec4@1.59.2 export png -o png model   # optional static exports
```

One post-build patch is required: the LikeC4 viewer hides edge labels while panning/zooming and at low zoom, which reads as flicker. Append this before the final `</body>` of the built HTML:

```html
<style id="darkly-label-override">.likec4-root[data-likec4-reduced-graphics][data-likec4-diagram-panning=true] .likec4-edge-label-container,:where([data-likec4-zoom-small=true]) .likec4-edge-label-container{display:block!important}</style>
```

## Embedding elsewhere

The HTML is fully self-contained and safe to iframe:

```html
<iframe src="/maps/darkly-suite-map.html#/view/index/"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style="width:100%;height:80vh;border:0" title="Darkly Suite system map"></iframe>
```

`allow-popups` is required (source links open in a new tab). Never add `allow-same-origin`.
