# Application notebooks

These five executed demonstrations are linked from the linear algebra lecture:

- `01_pca_features`: PCA features for digit recognition.
- `02_pca_exploration`: exploring the digit projection.
- `07_two_view_geometry`: normalized two-view geometry.
- `08_audio_svd_denoising`: low-rank synthetic audio filtering.
- `24_als_cholesky`: ALS and Cholesky updates.

The HTML exports contain their figures and outputs. They are published without
executing Python during the course website build. Sources use bundled or synthetic
data; environments, caches, generated validation reports and unused notebooks are
excluded.

To regenerate an individual HTML export with Python 3.10–3.13 from this directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m jupyter nbconvert --to html --execute 01_pca_features.ipynb
```

Use the same command with any other notebook filename. Optional `SAVE_OUTPUTS`
settings write experiment artifacts to `outputs/`.
