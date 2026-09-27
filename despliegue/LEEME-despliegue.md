# Publicar el curso en una VM de Google Compute Engine

El curso es un **sitio estático**: archivos y nada más. Una VM es capaz de servirlo,
pero también es la opción que más mantenimiento pide. Si algún día quieres algo más
simple, mira el final de este documento.

## 1. Crear el proyecto y la VM

1. Entra en `console.cloud.google.com` y crea un **proyecto** (o usa uno existente).
2. Activa la **facturación**. La capa gratuita la exige, aunque no cobre por la VM.
3. Menú → **Compute Engine → Instancias de VM → Crear instancia**:
   - **Región:** `us-central1`, `us-west1` o `us-east1` (la capa gratuita solo cubre estas).
   - **Tipo de máquina:** serie E2 → **e2-micro**.
   - **Disco de arranque:** Debian 12, disco **estándar** de 30 GB (el límite gratuito).
   - **Firewall:** marca **Permitir tráfico HTTP** y **Permitir tráfico HTTPS**.
4. Crear. En un minuto tendrás la VM con una IP pública.

> **Sobre el coste.** La capa gratuita cubre *una* e2-micro al mes en esas regiones, con
> 30 GB de disco estándar y 1 GB de salida de datos. Google **factura la dirección IPv4
> pública aparte**, así que la factura no suele ser exactamente cero: confírmalo en la
> consola. Y cuenta la salida: cada visita completa al curso descarga unos 15 MB, de modo
> que 1 GB da para unas 65 visitas al mes.

## 2. Instalar el curso

En la lista de instancias, pulsa **SSH** (abre una terminal en el navegador).

La imagen de Debian de Google **no trae git**, así que la primera línea lo instala.
Sustituye `USUARIO/REPO` por los tuyos de verdad — con el texto de ejemplo falla:

```bash
sudo apt-get update && sudo apt-get install -y git
git clone --depth 1 https://github.com/USUARIO/REPO.git /tmp/cruco
bash /tmp/cruco/despliegue/preparar-servidor.sh https://github.com/USUARIO/REPO.git
```

Eso instala nginx, descarga el curso en `/var/www/cruco` y lo deja sirviendo. Al terminar
te dice la dirección: `http://LA-IP-DE-LA-VM/`.

## 3. Dominio y HTTPS (opcional, recomendado)

1. En tu proveedor de dominios, crea un registro **A** que apunte a la IP de la VM
   (por ejemplo `curso.crucowine.com`).
2. Pon ese nombre en `server_name` dentro de `/etc/nginx/sites-available/cruco`.
3. Certificado gratuito, con renovación automática:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d curso.crucowine.com
```

Sin HTTPS algunos navegadores bloquean el arranque automático del audio y del vídeo, así
que este paso importa más de lo que parece.

## 4. Actualizar el curso cuando haya cambios

**A mano**, dentro de la VM:

```bash
bash /var/www/cruco/despliegue/actualizar.sh
```

**Automático:** el repo trae `.github/workflows/desplegar.yml`. Cada vez que se sube un
cambio a `main`, GitHub entra en la VM y la actualiza. Necesita tres secretos en
*Settings → Secrets and variables → Actions*:

| Secreto | Qué es |
|---|---|
| `VM_HOST` | la IP pública de la VM |
| `VM_USER` | tu usuario en la VM |
| `VM_SSH_KEY` | la clave **privada** cuya pública esté en `~/.ssh/authorized_keys` de la VM |

Para generar ese par de claves, en tu Mac:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/cruco-deploy -C "despliegue cruco" -N ""
cat ~/.ssh/cruco-deploy.pub    # esta va a la VM
cat ~/.ssh/cruco-deploy        # esta va al secreto VM_SSH_KEY
```

## 5. Mantenimiento que no desaparece

Una VM es un ordenador tuyo: cada pocas semanas conviene
`sudo apt-get update && sudo apt-get upgrade`. Si se apaga, el curso deja de estar.

## Alternativas sin servidor que mantener

El mismo repositorio, sin VM y con la misma dirección pública:

- **GitHub Pages** — *Settings → Pages → Source: main / root*. Gratis, un clic, HTTPS
  incluido. Es lo más simple que existe para este caso.
- **Cloud Storage** (Google) — subir la carpeta a un bucket y marcarlo como sitio web.
- **Firebase Hosting** (Google) — `firebase deploy`, HTTPS y CDN incluidos.

Las tres sirven el curso igual de bien, sin sistema operativo que actualizar.
