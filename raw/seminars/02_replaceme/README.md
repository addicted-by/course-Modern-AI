# ReplaceMe: замена блоков ViT с помощью МНК

`seminar_replaceme_clean.ipynb` — ноутбук с исходным кодом, с сохранёнными
результатами. `seminar_results.json` содержит измерения для таблиц и графиков.
Сборка сайта не выполняет ячейки и не загружает модель или CIFAR-100.

Из корня репозитория:

```sh
quarto render raw/seminars/02_replaceme/seminar_replaceme_clean.ipynb --to html --no-execute
```

При полной сборке сайта (`quarto render`) результат: `_site/raw/seminars/02_replaceme/seminar_replaceme_clean.html`.

Для повторного запуска держите `seminar_results.json` рядом с ноутбуком.
Зависимости перечислены в `requirements.txt` и самом ноутбуке; повторение
основного эксперимента требует совместимого CUDA PyTorch и `RUN_GPU = True`.
Датасет, модель и кэши экспериментов в репозиторий не включены.

Архив `seminar_replaceme_clean.zip` содержит ноутбук, готовые результаты,
зависимости и этот README. Пересоздать архив из этой папки:

```sh
python3 -m zipfile -c seminar_replaceme_clean.zip seminar_replaceme_clean.ipynb seminar_results.json requirements.txt README.md
```
