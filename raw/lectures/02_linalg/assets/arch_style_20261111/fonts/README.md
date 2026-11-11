# Local Frontier fonts

Unmodified regular upright variable TrueType fonts downloaded from the official [google/fonts repository](https://github.com/google/fonts) through the GitHub Contents API. Each font is redistributed with its SIL Open Font License 1.1. Italic variants were not downloaded.

Repository commit: `7085eb89a950e85db5b166b7a58d414544b4140c`.

CSS is in `local-fonts.css`. It defines only uniquely named `@font-face` families; it does not change the course theme. `font-display: block` and awaiting `document.fonts.ready` in browser QA prevent capturing an interim fallback.

| CSS family | Weight axis | Other axes | Complete Russian alphabet | Font bytes |
| --- | --- | --- | --- | ---: |
| Frontier Inter | 100–900 | opsz 14–32 | Yes | 876,576 |
| Frontier Space Grotesk | 300–700 | None | No | 136,676 |
| Frontier JetBrains Mono | 100–800 | None | Yes | 187,208 |

**Space Grotesk has no Cyrillic glyphs.** Use `"Frontier Space Grotesk", "Frontier Inter", sans-serif` for headings so Russian text deterministically uses the bundled Inter. Inter and JetBrains Mono contain every Russian letter including Ё/ё; verified directly from each font’s SFNT Unicode cmap table. Axis ranges were also read from each binary’s fvar table.

Recommended theme values:

```css
--lecture-font-sans: "Frontier Inter", sans-serif;
--lecture-font-heading: "Frontier Space Grotesk", "Frontier Inter", sans-serif;
--lecture-font-mono: "Frontier JetBrains Mono", monospace;
```

## Provenance

The download byte content was checked against the Git blob SHA from the GitHub API. SHA-256 hashes and source metadata are also recorded in `provenance.json`. The font binaries and licenses were not modified.

### Frontier Inter

[GitHub Contents API](https://api.github.com/repos/google/fonts/contents/ofl/inter?ref=7085eb89a950e85db5b166b7a58d414544b4140c)

- Local file: `Inter-variable.ttf`
- Original: [download](https://raw.githubusercontent.com/google/fonts/7085eb89a950e85db5b166b7a58d414544b4140c/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf)
- SHA-256: `29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031`
- Git blob SHA: `047c92f6e2212473dc436020afed689527076d44`

- Local file: `Inter-OFL.txt`
- Original: [download](https://raw.githubusercontent.com/google/fonts/7085eb89a950e85db5b166b7a58d414544b4140c/ofl/inter/OFL.txt)
- SHA-256: `5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57`
- Git blob SHA: `21f6aff961064c2e429f570995e446bcdd555422`

### Frontier Space Grotesk

[GitHub Contents API](https://api.github.com/repos/google/fonts/contents/ofl/spacegrotesk?ref=7085eb89a950e85db5b166b7a58d414544b4140c)

- Local file: `SpaceGrotesk-variable.ttf`
- Original: [download](https://raw.githubusercontent.com/google/fonts/7085eb89a950e85db5b166b7a58d414544b4140c/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf)
- SHA-256: `acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72`
- Git blob SHA: `a1b2e6c26093066510a31147e7aec9abdc8d6c5e`

- Local file: `SpaceGrotesk-OFL.txt`
- Original: [download](https://raw.githubusercontent.com/google/fonts/7085eb89a950e85db5b166b7a58d414544b4140c/ofl/spacegrotesk/OFL.txt)
- SHA-256: `564ce565c371c5e5bbf286006565a7c9aa55a9f56e7ca58d56e05d649dd61a72`
- Git blob SHA: `cb512b9af44ff61e75e1aad387b7424cdfab36a3`

### Frontier JetBrains Mono

[GitHub Contents API](https://api.github.com/repos/google/fonts/contents/ofl/jetbrainsmono?ref=7085eb89a950e85db5b166b7a58d414544b4140c)

- Local file: `JetBrainsMono-variable.ttf`
- Original: [download](https://raw.githubusercontent.com/google/fonts/7085eb89a950e85db5b166b7a58d414544b4140c/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf)
- SHA-256: `48715a42ec242c21e9f02692891e147d022299a52e48d5e413e1a942193ffeda`
- Git blob SHA: `aa310be8b717fe3774f9444dd89d5f4101cc6d10`

- Local file: `JetBrainsMono-OFL.txt`
- Original: [download](https://raw.githubusercontent.com/google/fonts/7085eb89a950e85db5b166b7a58d414544b4140c/ofl/jetbrainsmono/OFL.txt)
- SHA-256: `b2fe5e8987594e9ffd1d2ca52a2f5d73eb8335243893c5d6254b5ad69269591d`
- Git blob SHA: `821a3dac22aff15a1f1c9689a1d79c45bb58ca39`
