# tapsyrma-labs

Биология пәні бойынша интерактивті онлайн зертханалар. Мұғалім сабақ сессиясын жасайды, оқушылар кодпен кіреді, нәтиже бірден мұғалімге жіберіледі.

Production: https://dev-way.birqadam.kz/labs-tapsyrma/
Service: `tapsyrma-labs.service` (gunicorn, 127.0.0.1:8023)

## Жаңарту

```bash
cd /srv/tapsyrma-labs
env $(sudo cat /etc/tapsyrma-labs.env | xargs) python3 manage.py migrate
env $(sudo cat /etc/tapsyrma-labs.env | xargs) python3 manage.py collectstatic --noinput
sudo systemctl restart tapsyrma-labs.service
```

## Құпиялар

Тек `/etc/tapsyrma-labs.env` (mode 600) ішінде. Репозиторийде жоқ.

- `TAPSYRMA_SECRET_KEY` — Django secret key
- `TAPSYRMA_DB_PATH` — SQLite файлы
- `TAPSYRMA_DEBUG` — "1" әзірлеу үшін

## Құрылымы

- `config/` — Django параметрлері, URLs, WSGI
- `labs/` — негізгі app: модельдер, views, forms, templates
- `static/labs/style.css` — таза, минимал стиль (жасыл акцент)
- `scripts/seed_cell_lab.py` — үлгі зертхана ("Өсімдік жасушасының құрылымы")
- `db.sqlite3` — SQLite дерекқор (бэкап қажет)

## Nginx

Snippet: `/etc/nginx/snippets/tapsyrma-labs.conf` — `/labs-tapsyrma/` location
`dev-way.birqadam.kz` сайтына `include` арқылы қосылған.

## Rollback

Nginx конфигінің бэкабы: `/etc/nginx/sites-available/dev-way.birqadam.kz.bak-tapsyrma-*`.
