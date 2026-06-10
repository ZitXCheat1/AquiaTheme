# ─────────────────────────────────────────────────────────────────
# Stage 0: Build frontend assets
# ─────────────────────────────────────────────────────────────────
FROM --platform=$TARGETOS/$TARGETARCH node:22-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --network-timeout=300000

COPY . ./
RUN npm run build:production

# ─────────────────────────────────────────────────────────────────
# Stage 1: PHP application
# ─────────────────────────────────────────────────────────────────
FROM --platform=$TARGETOS/$TARGETARCH php:8.3-fpm-alpine AS app
WORKDIR /app

# System dependencies
RUN apk add --no-cache --update \
        ca-certificates \
        curl \
        dcron \
        git \
        libpng-dev \
        libxml2-dev \
        libzip-dev \
        mysql-client \
        nginx \
        supervisor \
        tar \
        tzdata \
        unzip \
    && docker-php-ext-configure zip \
    && docker-php-ext-install bcmath gd pdo_mysql zip opcache \
    && curl -sS https://getcomposer.org/installer \
       | php -- --install-dir=/usr/local/bin --filename=composer

# PHP OPcache tuning
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.memory_consumption=256'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.revalidate_freq=0'; \
        echo 'opcache.validate_timestamps=0'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# Copy application
COPY . ./
COPY --from=frontend /app/public/assets ./public/assets

# Composer install (no dev)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
    && mkdir -p bootstrap/cache storage/logs storage/framework/{sessions,views,cache} \
    && chmod 777 -R bootstrap/cache storage \
    && chown -R nginx:nginx .

# Cron (queue worker + cert renewal)
RUN echo "* * * * * /usr/local/bin/php /app/artisan schedule:run >> /dev/null 2>&1" \
        >> /var/spool/cron/crontabs/root \
    && echo "0 23 * * * certbot renew --nginx --quiet" \
        >> /var/spool/cron/crontabs/root

# Nginx / PHP-FPM / supervisord config
RUN rm -f /usr/local/etc/php-fpm.conf \
    && mkdir -p /var/run/php /var/run/nginx /app/storage/logs/ \
    && sed -i 's/ssl_session_cache/#ssl_session_cache/g' /etc/nginx/nginx.conf

COPY .github/docker/default.conf   /etc/nginx/http.d/default.conf
COPY .github/docker/www.conf       /usr/local/etc/php-fpm.conf
COPY .github/docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost/up || exit 1

ENTRYPOINT ["/bin/ash", ".github/docker/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
