#!/bin/bash
# Prepara una VM Debian recién creada para servir la experiencia web de CruCo.
# Se ejecuta UNA vez, dentro de la VM:
#     bash preparar-servidor.sh https://github.com/USUARIO/REPO.git
set -euo pipefail

REPO="${1:?Uso: bash preparar-servidor.sh <url-del-repo-git>}"
DESTINO=/var/www/cruco

echo "==> Actualizando el sistema e instalando nginx y git"
sudo apt-get update -qq
sudo apt-get install -y -qq nginx git

echo "==> Descargando el curso en $DESTINO"
sudo rm -rf "$DESTINO"
sudo git clone --depth 1 "$REPO" "$DESTINO"
sudo chown -R www-data:www-data "$DESTINO"

echo "==> Configurando nginx"
sudo cp "$DESTINO/despliegue/nginx-cruco.conf" /etc/nginx/sites-available/cruco
sudo ln -sf /etc/nginx/sites-available/cruco /etc/nginx/sites-enabled/cruco
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo
echo "Listo. El curso responde en http://$(curl -s -m 5 ifconfig.me || echo '<IP-de-la-VM>')/"
echo "Para actualizarlo más adelante:  bash $DESTINO/despliegue/actualizar.sh"
