# Размещение Happy Sales Control

Статическая production-сборка размещается на VPS в каталоге
`/var/www/happysalescontrol`. Каждый выпуск хранится в отдельной папке
`releases`, а ссылка `current` переключается на проверенный выпуск атомарно.

Nginx обслуживает `happysalescontrol.ridfinance.ru` и возвращает `index.html`
для маршрутов React Router. HTTPS выпускается и продлевается Certbot после
переключения DNS на VPS.

Перед переключением DNS новый выпуск проверяется запросом к IP сервера с
заголовком `Host: happysalescontrol.ridfinance.ru`. Старые выпуски сохраняются
для быстрого отката.
