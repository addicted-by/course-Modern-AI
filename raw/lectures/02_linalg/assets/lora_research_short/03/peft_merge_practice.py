"""Reproduce the two-regression LoRA merge on CPU. No model download is needed.

Tested with Python 3.14.7. In a fresh environment:
    python -m pip install torch==2.14.0 peft==0.21.3 transformers==5.17.0 accelerate==1.16.0
    python peft_merge_practice.py

Each specialist fits one correction to the same frozen linear map. Temporary
adapter checkpoints exercise the public load, save and folding paths.
"""

from collections import OrderedDict
from pathlib import Path
from tempfile import TemporaryDirectory

import torch
from peft import LoraConfig, PeftModel, get_peft_model
from torch import nn


def make_base():
    projection = nn.Linear(3, 2, bias=False, dtype=torch.float32)
    projection.weight.copy_(torch.tensor([[0.13, 0.31, -0.17], [0.11, -0.29, 0.23]]))
    return nn.Sequential(OrderedDict(projection=projection))


def task_batch(axis, values):
    # A third feature contributes through the frozen base on both tasks.
    x = torch.zeros(len(values), 3)
    x[:, axis] = values
    x[:, 2] = 0.25 * values.square()
    y = make_base()(x)
    y[:, axis] += (3.0, 1.0)[axis] * values
    return x, y


def fit_specialist(axis, path):
    alpha = (2, 3)[axis]
    config = LoraConfig(r=1, lora_alpha=alpha, target_modules=["projection"])
    model = get_peft_model(make_base(), config)
    layer = model.get_base_model().projection
    # Fix A to read the task coordinate. Fit B by scalar least squares.
    t = torch.tensor([-2.0, -1.0, 1.0, 2.0])
    x, y = task_batch(axis, t)
    layer.lora_A["default"].weight.zero_()[0, axis] = 1.0
    residual = y - layer.base_layer(x)
    fitted = (residual.T @ t) / (t.square().sum() * layer.scaling["default"])
    layer.lora_B["default"].weight[:, 0].copy_(fitted)
    model.save_pretrained(path)


@torch.no_grad()
def run(path):
    torch.manual_seed(17)
    specialists = ["horizontal", "vertical"]
    weights = [1.0, 0.75]
    for axis, name in enumerate(specialists):
        fit_specialist(axis, path / name)

    model = PeftModel.from_pretrained(make_base(), path / "horizontal", adapter_name="horizontal")
    model.load_adapter(path / "vertical", adapter_name="vertical")
    layer = model.get_base_model().projection
    target = sum(
        weight * layer.scaling[name] * (layer.lora_B[name].weight @ layer.lora_A[name].weight)
        for name, weight in zip(specialists, weights)
    )
    model.add_weighted_adapter(specialists, weights, "cat", combination_type="cat")
    model.add_weighted_adapter(specialists, weights, "svd1", combination_type="svd",
                               svd_rank=1, svd_full_matrices=False)
    assert layer.lora_A["cat"].weight.shape == (2, 3)
    assert layer.lora_B["cat"].weight.shape == (2, 2)
    assert layer.lora_A["svd1"].weight.shape == (1, 3)
    assert layer.lora_B["svd1"].weight.shape == (2, 1)
    torch.testing.assert_close(layer.get_delta_weight("cat"), target)
    u, singular_values, vh = torch.linalg.svd(target, full_matrices=False)
    torch.testing.assert_close(layer.get_delta_weight("svd1"), (u[:, :1] * singular_values[:1]) @ vh[:1])

    test = [task_batch(axis, torch.tensor([-1.5, -0.5, 0.5, 1.5])) for axis in range(2)]
    print("Adapter        MAE horizontal   MAE vertical")
    expected_mae = {"horizontal": [0.0, 0.5], "vertical": [1.5, 0.0],
                    "cat": [0.0, 0.125], "svd1": [0.0, 0.5]}
    for name in [*specialists, "cat", "svd1"]:
        model.set_adapter(name)
        model.eval()
        errors = [(model(x) - y).abs().mean().item() for x, y in test]
        torch.testing.assert_close(torch.tensor(errors), torch.tensor(expected_mae[name]), rtol=1e-5, atol=1e-6)
        print(f"{name:12} {errors[0]:16.4f} {errors[1]:14.4f}")

    # Keep the candidate with lower validation error across the two tasks.
    model.set_adapter("cat")
    model.eval()
    probes = torch.cat([test[0][0], test[1][0], torch.randn(32, 3)])
    before = model(probes)
    model.save_pretrained(path / "selected", selected_adapters=["cat"])
    reloaded = PeftModel.from_pretrained(make_base(), path / "selected" / "cat").eval()
    torch.testing.assert_close(reloaded(probes), before)
    folded = reloaded.merge_and_unload(safe_merge=True).eval()
    after = folded(probes)
    torch.testing.assert_close(after, before, rtol=1e-5, atol=1e-6)
    print(f"Max FP32 output difference after folding: {(before - after).abs().max().item():.3g}")


if __name__ == "__main__":
    with TemporaryDirectory() as directory:
        run(Path(directory))
