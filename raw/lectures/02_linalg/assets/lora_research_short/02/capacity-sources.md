# Capacity exhibits in the current lecture

| Slide | Exhibit and provenance |
| --- | --- |
| L38 | Redrawn measured validation accuracies from [AdaLoRA, Fig. 1(b)](https://arxiv.org/pdf/2303.10512v2#page=2). Highlighted cells indicate the selected block range in each run. |
| L39 | Measured WikiSQL validation accuracy and per-projection ranks from [LoRA, Table 5](https://arxiv.org/pdf/2106.09685v2#page=10). Ribbon widths encode rank within the matched budget. |
| L41 | Measured MNLI-matched accuracies redrawn as dots from [AdaLoRA, Fig. 1(a)](https://arxiv.org/pdf/2303.10512v2#page=2). The dots share a restricted linear axis spanning 88.5–90%. The Llama-3.1-8B comparison uses the left panel and parameter-count table of [Thinking Machines Lab, Fig. 4](https://thinkingmachines.ai/blog/lora/#layers-where-lora-is-applied). |
| L48 | [HydraLoRA authors’ Fig. 1(b–c)](https://papers.nips.cc/paper_files/paper/2024/file/123fd8a56501194823c8e0dca00733df-Paper-Conference.pdf#page=2). Factor-only cost calculation for three equal-sized branches derived from the two architectures. |
| L50 | Authors’ experimental MLP1 panels and common key from [LoRA vs Full Fine-tuning: An Illusion of Equivalence, Fig. 14(a–b)](https://proceedings.nips.cc/paper_files/paper/2025/file/ff541950d1e885af90f523571564a401-Paper-Conference.pdf#page=23). Original vertical scales differ. |
| L51 | Worked spectra with four nonzero singular values. Effective ranks are calculated with [Roy and Vetterli’s Eqs. (1)–(2)](https://www.eurasip.org/Proceedings/Eusipco/Eusipco2007/Papers/a5p-h05.pdf#page=1). |
| L53 | [LoRA vs Full Fine-tuning: An Illusion of Equivalence, Fig. 3](https://proceedings.nips.cc/paper_files/paper/2025/file/ff541950d1e885af90f523571564a401-Paper-Conference.pdf#page=4) heatmaps. The narrow variant stacks the two source panels. |
| L54 | Projection-length chart for two constructed 4D unit directions, using the sign-invariant criterion from [LoRA vs Full Fine-tuning: An Illusion of Equivalence, Fig. 2(c) and Algorithm 1](https://proceedings.nips.cc/paper_files/paper/2025/file/ff541950d1e885af90f523571564a401-Paper-Conference.pdf#page=4). The threshold 0.60 is illustrative. |
| L06 | Authors’ incremental-SVD schematic from [EVA, Fig. 1, left](https://proceedings.neurips.cc/paper_files/paper/2025/file/41d33bd41fd44bd9dba0e092047cf213-Paper-Conference.pdf#page=2) with the projection-error objective from Theorem 3.1. |
| L64 | Constructed variance scores and cap for two layers, following the global allocation procedure in [EVA, §3.5](https://proceedings.neurips.cc/paper_files/paper/2025/file/41d33bd41fd44bd9dba0e092047cf213-Paper-Conference.pdf#page=4). |
| L60 | Constructed importance scores and mask applying [AdaLoRA, Eqs. (3), (6)](https://arxiv.org/pdf/2303.10512v2#page=4). |
| L61 | Authors’ measured final-rank heatmap from [AdaLoRA, Fig. 3](https://arxiv.org/pdf/2303.10512v2#page=10). The narrow variant stacks the first and last six blocks. |
| L66 | Measured training cost, MNLI rows for the 0.08% budget, from [AdaLoRA, Table 15](https://arxiv.org/pdf/2303.10512v2#page=17). The deltas subtract LoRA from AdaLoRA. |
| L32 | `capacity-code-scaling.svg` redraws exact HumanEval pass@1 data from [LoRA Learns Less and Forgets Less, Table S1](https://arxiv.org/pdf/2405.09673v2#page=27) on a log-scaled token axis. The narrow variant retains the 16B point and omits its axis label for spacing. The slide’s speaker notes compare the separate code instruction-fine-tuning run from §4.1 and Table S5. |
| L36 | Authors’ parameter sweep from [Learning Rate Scaling, Fig. 2(a)](https://raw.githubusercontent.com/mlresearch/v306/main/assets/chen26ei/chen26ei.pdf#page=2). |
| L37 | `capacity-small-rank.svg` redraws the two selected MultiNLI rows from [LoRA, Table 6](https://arxiv.org/pdf/2106.09685v2#page=10) on a log-scaled rank axis. |

The desktop and narrow SVGs use the same reported values. The earlier `paper_assets_02.json` records exact crop geometry and reuse details for the retained paper figures.
