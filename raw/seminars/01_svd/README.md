# Семинар: от CPU и GPU к сингулярному разложению

`seminar01-svd.ipynb` — ноутбук с исходным кодом. HTML показывает сохранённые
результаты; сборка сайта не выполняет ячейки.

Из корня репозитория:

```sh
quarto render raw/seminars/01_svd/seminar01-svd.ipynb --to html --no-execute
```

При полной сборке сайта (`quarto render`) результат: `_site/raw/seminars/01_svd/seminar01-svd.html`.

Для запуска исходный ноутбук рассчитан на Kaggle: через **Add Input** подключите
учебный Dataset с `seminar-kaggle-linux64.zip`. Первая ячейка проверяет версию
установщика, разворачивает среду и запускает учебное ядро. Данные Olivetti Faces
и остальные учебные материалы ожидаются внутри этой среды по пути
`/kaggle/working/seminar-env/share/seminar`. Архив среды и данные не включены
в публикацию сайта; для чтения HTML они не нужны.
