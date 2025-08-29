# SSL/TLS Certificate Setup Guide

## Overview
This guide covers SSL/TLS certificate setup and management for YumZoom production deployment.

## Certificate Requirements

### Production Certificate
- **Type**: Domain Validated (DV) or Extended Validation (EV)
- **Algorithm**: RSA 2048-bit or ECC P-256
- **Validity**: 90 days (Let's Encrypt) or 1-2 years (Commercial CA)
- **SAN Support**: Required for multiple subdomains

### Development Certificate
- **Type**: Self-signed certificate for local HTTPS testing
- **Tools**: mkcert, OpenSSL, or Next.js built-in HTTPS

## Certificate Sources

### Recommended Certificate Authorities
1. **Let's Encrypt** (Free, automated)
   - Automated renewal with Certbot
   - 90-day validity, auto-renewal recommended
   - Supports wildcard certificates

2. **Cloudflare** (Free with Cloudflare proxy)
   - Automatic SSL through Cloudflare
   - Origin certificates for backend

3. **Commercial CAs**
   - DigiCert, GlobalSign, Sectigo
   - Extended validation options
   - Longer validity periods

## Setup Instructions

### Option 1: Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yumzoom.com -d www.yumzoom.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Cloudflare SSL

1. **Add domain to Cloudflare**
2. **Update nameservers** to Cloudflare
3. **Enable SSL/TLS** in Cloudflare dashboard
4. **Set SSL mode** to "Full (strict)"
5. **Generate origin certificate** for server

### Option 3: Manual Certificate Installation

```bash
# Create certificate directory
sudo mkdir -p /etc/ssl/certs/yumzoom
sudo mkdir -p /etc/ssl/private/yumzoom

# Install certificate files
sudo cp yumzoom.com.crt /etc/ssl/certs/yumzoom/
sudo cp yumzoom.com.key /etc/ssl/private/yumzoom/
sudo cp intermediate.crt /etc/ssl/certs/yumzoom/

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/yumzoom/*
sudo chmod 600 /etc/ssl/private/yumzoom/*
```

## Web Server Configuration

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yumzoom.com www.yumzoom.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yumzoom.com www.yumzoom.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yumzoom/yumzoom.com.crt;
    ssl_certificate_key /etc/ssl/private/yumzoom/yumzoom.com.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS Header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName yumzoom.com
    ServerAlias www.yumzoom.com
    Redirect permanent / https://yumzoom.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yumzoom.com
    ServerAlias www.yumzoom.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/yumzoom/yumzoom.com.crt
    SSLCertificateKeyFile /etc/ssl/private/yumzoom/yumzoom.com.key
    SSLCertificateChainFile /etc/ssl/certs/yumzoom/intermediate.crt
    
    # SSL Security
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder on
    
    # HSTS Header
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    
    # Proxy to Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## Certificate Monitoring

### Expiration Monitoring

```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/yumzoom/yumzoom.com.crt -noout -dates

# Monitor with script
#!/bin/bash
CERT_FILE="/etc/ssl/certs/yumzoom/yumzoom.com.crt"
DAYS_WARNING=30

EXPIRY_DATE=$(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS_WARNING ]; then
    echo "WARNING: Certificate expires in $DAYS_LEFT days!"
    # Send alert email here
fi
```

### Automated Renewal

```bash
# Systemd timer for Let's Encrypt renewal
# /etc/systemd/system/certbot-renewal.service
[Unit]
Description=Certbot renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
ExecStartPost=/bin/systemctl reload nginx

# /etc/systemd/system/certbot-renewal.timer
[Unit]
Description=Run certbot twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
```

## Development HTTPS Setup

### Using mkcert (Recommended)

```bash
# Install mkcert
npm install -g mkcert

# Create local certificate authority
mkcert -install

# Generate certificate for localhost
mkcert localhost 127.0.0.1 ::1

# Use with Next.js
npm run dev:https
```

### Using OpenSSL

```bash
# Generate private key
openssl genrsa -out localhost.key 2048

# Generate certificate signing request
openssl req -new -key localhost.key -out localhost.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt
```

## Security Validation

### SSL Test Tools
1. **SSL Labs SSL Test**: https://www.ssllabs.com/ssltest/
2. **SecurityHeaders.com**: https://securityheaders.com/
3. **Mozilla Observatory**: https://observatory.mozilla.org/

### Certificate Validation Commands

```bash
# Test SSL connection
openssl s_client -connect yumzoom.com:443

# Check certificate chain
openssl s_client -connect yumzoom.com:443 -showcerts

# Verify certificate matches private key
openssl rsa -in private.key -pubout -outform PEM | sha256sum
openssl x509 -in certificate.crt -pubkey -noout -outform PEM | sha256sum
```

## Troubleshooting

### Common Issues

1. **Mixed Content Warnings**
   - Ensure all resources use HTTPS
   - Update any hardcoded HTTP URLs

2. **Certificate Chain Issues**
   - Include intermediate certificates
   - Verify certificate order

3. **Permission Errors**
   - Check file permissions on certificate files
   - Ensure web server user can read certificates

4. **Renewal Failures**
   - Check DNS configuration
   - Verify domain ownership
   - Review Certbot logs

### Emergency Procedures

If certificates fail:
1. **Temporary Fix**: Use Cloudflare proxy SSL
2. **Backup Plan**: Keep valid backup certificates
3. **Monitoring**: Set up alerts for certificate issues

## Security Best Practices

1. **Use Strong Ciphers**: Disable weak SSL/TLS versions
2. **Enable HSTS**: Implement HTTP Strict Transport Security
3. **Certificate Pinning**: Consider for mobile apps
4. **Regular Updates**: Keep certificate tools updated
5. **Access Control**: Restrict certificate file access

## Contact Information

For certificate-related issues:
- **SSL Provider Support**: Contact your certificate authority
- **DNS Issues**: Contact domain registrar
- **Server Configuration**: Contact system administrator
