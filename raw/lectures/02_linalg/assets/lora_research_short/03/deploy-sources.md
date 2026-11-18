# Evidence for the closing LoRA slides

| Slide | Material and locator |
|---|---|
| L94 | LoRA-Squeeze §3.1. The ellipse and segment show the images of the unit disk before and after exact rank-1 truncation of an illustrative diagonal update. |
| L137 | LoRA-Squeeze Appendix D, Eqs. (1)–(9). Exact thin-QR reduction with an illustrative 4096 × 4096 layer and factor width 128. Shape silhouettes emphasize the thin axes and are schematic. |
| L96 | LoRA-Squeeze Fig. 4(a) and §5. The five plotted values are the target-rank-8 column including the source-rank-8 diagonal. |
| L97 | SVD-LLM Table 4. Logarithmic dot plot of the 40% compression column from the full-model ablation; the 20% data are in notes. |
| L98 | SVD-LLM §3.1, Theorem 3.2 and Corollary 3.3. The L94 update is reused with calibration inputs of different magnitudes. The faint ellipse is the image of the coefficient-space unit disk under the calibrated map. Solid segments show the retained image and dashed diameters mark the dropped direction. |
| L100 | G³-LoRA Fig. 4 shows a qualitative thermotics pair before distillation. Fig. 1, stages 3–4 and §2.2, Eq. (6) explain the workflow. Multi-view consistency scores are from Appendix D, Table 8, under the quick VBench2.0 protocol. |
| L104 | Original LoRA §4.1. The deployment flow distinguishes the saved base from the working weight. The speaker notes give the scalar FP16 fold using round-to-nearest, ties-to-even. |
| L105 | S-LoRA Fig. 2 and §§4.1, 5.1. The original memory figure is paired with illustrative two-request algebra in the deck's column convention. |
| L99 | S-LoRA Fig. 7 and §7.3. The ~50% observation is a visual reading of the first-token SLO panel at four arrivals per second. The authors use model IDs as proxy adapter IDs in a rescaled Chatbot Arena trace. |

The local PNGs were rendered at five pixels per PDF point. The S-LoRA figure regions are in the [paper asset ledger](paper_assets_03.json). Both cited arXiv versions declare a perpetual non-exclusive arXiv distribution license. The figures carry descriptive alternative text.

- `deploy-thermotics-base.png` and `deploy-thermotics-grouped.png` select the 5%, 45%, and 85% frames from each thermotics row of G³-LoRA v1, physical page 8, Fig. 4. In PDF points, the three column intervals are approximately [155, 222], [293, 359], and [430, 496]. The base row spans [220, 259] vertically and the grouped row spans [260, 299]. Frames keep the original horizontal chronology.
- `deploy-slora-fig7.png` crops S-LoRA v3, physical page 9, Fig. 7. The mobile counterpart stacks the same authors’ plots under the original shared legend.

- `deploy-paging-desktop.png` uses the authors’ S-LoRA v3 Fig. 2 crop on physical page 3, PDF points (304.2, 330.75, 544.5, 444.6). `deploy-paging-mobile.png` stacks the source host and GPU regions (305, 331, 406.6, 397.1) and (412, 331, 543, 441.5), with the connecting flow re-typeset.
- `deploy-map-base.svg` and `deploy-map-rank1.svg` on L94 and `deploy-map-weight.svg` and `deploy-map-output.svg` on L98 are original geometric illustrations for the deck.
