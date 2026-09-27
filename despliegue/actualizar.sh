#!/bin/bash
# Trae la última versión del curso desde GitHub. Se ejecuta dentro de la VM.
set -euo pipefail
DESTINO=/var/www/cruco
cd "$DESTINO"
sudo git fetch --depth 1 origin main
sudo git reset --hard origin/main
sudo chown -R www-data:www-data "$DESTINO"
echo "Actualizado a $(sudo git log -1 --format='%h %s')"
