# Capacity and multitask learning

In the current deck, each slide in [expanded_02.qmd](../../../lora_parts/expanded_02.qmd) links to the paper, figure, table, or equation behind its claim. The speaker notes identify the setup for reported values and the constructed inputs for worked examples.

| Slides | How to read the exhibit |
| --- | --- |
| L38–L37, in presentation order | [Capacity exhibits and per-slide sources](capacity-sources.md) covers placement, effective rank, allocation, and tuning. |
| L69–L70 | The shared-versus-specialist schematic illustrates the training setup in Yang et al. Table 1 supplies the three validation comparisons. The gap is shared minus separate. |
| L71 | Raffel et al., Table 11. Cell values are reported scores. The bar lengths show their differences from equal sampling, using the same scale for both metrics. |
| L73–L74 | Original coordinate drawings and arithmetic illustrating Yu et al., Figure 2 and Algorithm 1. Both drawings use the same two gradients. |
| L80 | Liu et al.’s HydraLoRA method. The numerical routing example illustrates the softmax mixture. |

## Earlier editions

### LoRA lecture · Capacity and sharing

| Slide | Exhibit | Provenance |
| --- | --- | --- |
| L59 (removed) | Parameter-budget diagram and narrow redraw | Constructed cost example. The desktop diagram comes from the prior local lecture; width costs are 2,048 and 5,120 scalars per component. |
| L64 | Global score sorting and parameter costs | Illustration of [EVA, §3.2 and §3.5](https://proceedings.neurips.cc/paper_files/paper/2025/file/41d33bd41fd44bd9dba0e092047cf213-Paper-Conference.pdf). Scores are constructed and are neither measured values nor probabilities. |
| L36, L37 | Sweep table and validation plot | Constructed examples. The plot is generated using `python3 build_threshold.py`. |
| L69 | Shared-adapter timeline | Constructed example. The timeline artwork comes from the prior local lecture. |
| L73, L74 | Analytic loss contours and signed component subtraction | Constructed example. The contours come from `python3 build_local_loss.py`. The local dot-product criterion and projection rule follow [Gradient Surgery, §2.2–2.3, Fig. 2, Algorithm 1](https://proceedings.neurips.cc/paper_files/paper/2020/file/3fe78a8acf5fda99de95303940a2420c-Paper.pdf). |
| L91 | Worked matrix compatibility comparison | Constructed scenario derived from the requirements for adding weight updates in the same coordinates. |

All SVGs are informative and have an English text alternative in the slide source.

## Restored exhibits

| Slides | Provenance |
| --- | --- |
| L38–L39 | Original diagram and exact table excerpt from Hu et al., LoRA, §7.1 and Table 5. |
| L41 | Tulu3 test NLL from LoRA Without Regret, Fig. 4 left panel and adjacent parameter-count table. Numeric redraw retained from archived lecture. |
| L48 | Constructed fused QKV diagram with canonical output-row formulas, informed by Microsoft LoRA README, Additional Notes, item 2. |
| L50–L54 | Constructed spectra, orientation and cosine examples. Effective rank follows Roy and Vetterli. Intruder criterion follows Shuttleworth et al., Definition 3.1. |
| L06 | Constructed representative input cloud from the archived lecture, illustrating Paischer et al., EVA, §3.2. |
| L60–L66 | Constructed masking and importance-selection examples. AdaLoRA mechanism from Zhang et al., with the export behavior pinned to the cited PEFT revision. |
| L32 | Archived numerical redraw of LoRA Without Regret, Tulu3 panel in Fig. 1. Each curve is the pointwise minimum over learning-rate runs. |
| L70 | Archived signed performance differences from Yang et al., Table 1, with per-task metrics and unequal total adapter storage. |
| L71 | Constructed sampling example based on the expectation over one task draw per step. |
| L80 | Constructed fixed-update and input-dependent routing comparison, based on the cited description in Liu et al. |

## Revised decision figures

Regenerate the desktop and mobile SVGs with `python3 build_decision_figures.py`. The plot mapped to L39 transcribes Hu et al., Table 5. The eight-slot bars visualize the equal rank-component count per block at the matched parameter budget. L48 uses a constructed fused matrix layout. L53 uses exact semiaxes of the positive-definite adapted matrices and unit directional arrows on common axes. L54 and L36 visualize the established illustrative scores and trial values. L71 counts one versus three instances of task B in ten illustrative batches. L73 draws the two analytic losses along the step described in its notes. L74 draws actual parameter displacements in the same constructed loss example and labels the first-order effect as distinct from the exact effect.

## Worked examples for the gallery revision

`python3 build_worked_examples.py` generates the active SVGs for L53, L36, L73, and L74, with separate desktop and mobile layouts. These are original teaching exhibits using constructed matrices, trial scores, and analytic losses. L53 relates its two rank-one updates to the leading-axis interpretation discussed by Shuttleworth et al. L73 and L74 illustrate the conflict criterion and pairwise projection in Yu et al., §2.2–2.3. The exact loss outcomes and local linear predictions use the quadratic functions given in L73's notes.

## Earlier primary-paper edition

`paper_assets_02.json` records the provenance of the original paper crops. Earlier entries above describe archived exhibits from prior lecture editions.
