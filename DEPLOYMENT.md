# AZEDOC Deployment Guide

**Production Deployment Instructions for Turkey & Regional Markets**

---

## Quick Start (Local Development)

```bash
# Clone
git clone https://github.com/yourorg/azedoc.git
cd azedoc

# Configure
cp .env.example .env
nano .env  # Add your ANTHROPIC_API_KEY

# Run
ruby server.rb

# Access
# http://localhost:4200
```

---

## Docker Deployment (Recommended for Production)

### Build Docker Image

```dockerfile
# Dockerfile
FROM ruby:3.2-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock ./
COPY . .

RUN mkdir -p logs

EXPOSE 4200

CMD ["ruby", "server.rb"]
```

### Build & Run

```bash
# Build image
docker build -t azedoc:2.0 .

# Create volume for logs (persistent)
docker volume create azedoc-logs

# Run container
docker run -d \
  --name azedoc \
  -p 4200:4200 \
  -e ANTHROPIC_API_KEY=sk-ant-api03-... \
  -e ALLOWED_ORIGINS=https://yourhospital.com \
  -e JWT_SECRET=your-hospital-secret-key \
  -e REGION=turkey \
  -v azedoc-logs:/app/logs \
  azedoc:2.0

# View logs
docker logs azedoc

# Monitor
docker stats azedoc
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  azedoc:
    image: azedoc:2.0
    container_name: azedoc-prod
    ports:
      - "4200:4200"
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      ALLOWED_ORIGINS: https://yourhospital.com,https://clinic.yourhospital.com
      JWT_SECRET: ${JWT_SECRET}
      REGION: turkey
      ENABLE_AUDIT_LOGGING: "true"
      NODE_ENV: production
    volumes:
      - azedoc-logs:/app/logs
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4200/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - hospital-network

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: azedoc-proxy
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - azedoc
    networks:
      - hospital-network

volumes:
  azedoc-logs:
    driver: local

networks:
  hospital-network:
    driver: bridge
```

### Run Docker Compose

```bash
# Create .env file with secrets
cp .env.example .env
nano .env  # Fill in values

# Start services
docker-compose up -d

# View logs
docker-compose logs -f azedoc

# Stop
docker-compose down
```

---

## Kubernetes Deployment (Hospital Cloud Infrastructure)

### Docker Image

```bash
# Tag for registry
docker tag azedoc:2.0 yourhospital-registry.azurecr.io/azedoc:2.0

# Push to registry
docker push yourhospital-registry.azurecr.io/azedoc:2.0
```

### Kubernetes Manifest

```yaml
# k8s-deployment.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: azedoc

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: azedoc-config
  namespace: azedoc
data:
  REGION: "turkey"
  NODE_ENV: "production"
  ENABLE_AUDIT_LOGGING: "true"
  API_RATE_LIMIT_REQUESTS: "100"
  API_RATE_LIMIT_WINDOW_MS: "900000"

---
apiVersion: v1
kind: Secret
metadata:
  name: azedoc-secrets
  namespace: azedoc
type: Opaque
stringData:
  ANTHROPIC_API_KEY: sk-ant-api03-...
  JWT_SECRET: your-hospital-secret-key
  ALLOWED_ORIGINS: https://azedoc.yourhospital.com,https://hospital.com

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: azedoc-app
  namespace: azedoc
  labels:
    app: azedoc
spec:
  replicas: 2  # High availability
  selector:
    matchLabels:
      app: azedoc
  template:
    metadata:
      labels:
        app: azedoc
    spec:
      containers:
      - name: azedoc
        image: yourhospital-registry.azurecr.io/azedoc:2.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 4200
          name: http
        envFrom:
        - configMapRef:
            name: azedoc-config
        - secretRef:
            name: azedoc-secrets
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 4200
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 4200
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 2
      volumes:
      - name: logs
        persistentVolumeClaim:
          claimName: azedoc-logs-pvc

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: azedoc-logs-pvc
  namespace: azedoc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: hospital-standard
  resources:
    requests:
      storage: 10Gi

---
apiVersion: v1
kind: Service
metadata:
  name: azedoc-service
  namespace: azedoc
spec:
  type: ClusterIP
  selector:
    app: azedoc
  ports:
  - protocol: TCP
    port: 4200
    targetPort: 4200

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: azedoc-hpa
  namespace: azedoc
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: azedoc-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Deploy
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -n azedoc
kubectl logs -n azedoc -l app=azedoc -f

# Access service
kubectl port-forward -n azedoc svc/azedoc-service 4200:4200

# Scale
kubectl scale deployment azedoc-app -n azedoc --replicas=5

# Delete
kubectl delete namespace azedoc
```

---

## Nginx Reverse Proxy (SSL Termination)

### Configuration

```nginx
# nginx.conf
upstream azedoc_backend {
    server localhost:4200;
}

server {
    listen 80;
    server_name yourhospital.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourhospital.com;

    # SSL Certificates
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    # SSL Configuration
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/azedoc-access.log;
    error_log /var/log/nginx/azedoc-error.log;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=azedoc_limit:10m rate=10r/s;
    limit_req zone=azedoc_limit burst=20 nodelay;

    # Proxy Settings
    location / {
        proxy_pass http://azedoc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://azedoc_backend;
        access_log off;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourhospital.com -d www.yourhospital.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Renewal check
certbot renew --dry-run
```

---

## systemd Service (Linux/Docker)

### Service Configuration

```ini
# /etc/systemd/system/azedoc.service
[Unit]
Description=AZEDOC Clinical AI Platform
After=network.target

[Service]
Type=simple
User=azedoc
WorkingDirectory=/home/azedoc/azedoc
Environment="PATH=/home/azedoc/.rbenv/shims:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
EnvironmentFile=/home/azedoc/azedoc/.env
ExecStart=/home/azedoc/.rbenv/shims/ruby /home/azedoc/azedoc/server.rb
Restart=on-failure
RestartSec=10s

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=yes

# Resource Limits
LimitNOFILE=10000
LimitNPROC=512

[Install]
WantedBy=multi-user.target
```

### Enable & Start

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable azedoc

# Start service
sudo systemctl start azedoc

# Check status
sudo systemctl status azedoc

# View logs
sudo journalctl -u azedoc -f

# Stop service
sudo systemctl stop azedoc
```

---

## Monitoring & Alerts

### Health Check Endpoint

```bash
# Test health
curl http://localhost:4200/api/health

# Expected response
{
  "status": "ok",
  "version": "2.0.0",
  "region": "turkey",
  "timestamp": "2025-03-10T10:05:00Z"
}
```

### Monitoring Services

**Prometheus (Recommended)**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'azedoc'
    static_configs:
      - targets: ['localhost:4200']
    metrics_path: '/metrics'
```

**Grafana Dashboards**
- Request rates
- Error rates
- Response times
- CPU/Memory usage
- Audit log activity

**AlertManager Rules**
```yaml
groups:
- name: azedoc
  rules:
  - alert: AZEDOCDown
    expr: up{job="azedoc"} == 0
    for: 5m
    annotations:
      summary: "AZEDOC is down"
```

---

## Backup & Disaster Recovery

### Log Backup

```bash
# Daily backup
0 2 * * * tar -czf /backups/azedoc-logs-$(date +%Y%m%d).tar.gz /app/logs/

# To AWS S3
0 3 * * * aws s3 cp /backups/ s3://hospital-backups/azedoc/logs/ --recursive
```

### Database Backup

```bash
# If using database (future)
0 2 * * * mysqldump azedoc > /backups/azedoc-db-$(date +%Y%m%d).sql

# Verify backup
ls -lah /backups/azedoc-db-*.sql
```

### Recovery Procedure

```bash
# Restore logs
tar -xzf /backups/azedoc-logs-20250310.tar.gz -C /app/

# Restore database
mysql azedoc < /backups/azedoc-db-20250310.sql

# Verify
curl http://localhost:4200/api/health
```

---

## Performance Tuning

### Ruby Configuration

```bash
# ~/.rbenv/versions/3.2.0/etc/rbenv.rc
RUBY_GC_HEAP_INIT_SLOTS=400000
RUBY_GC_HEAP_FREE_SLOTS=100000
RUBY_GC_HEAP_GROWTH_FACTOR=1.8
RUBY_GC_HEAP_OLDOBJECT_LIMIT_FACTOR=2.0
```

### WEBrick Configuration (server.rb)

```ruby
server = WEBrick::HTTPServer.new(
  Port: PORT,
  MaxClients: 256,              # Concurrent connections
  AccessLog: [[$stdout, format]], # Logging
  Logger: logger,
  RequestTimeout: 30,           # Max request time
)
```

### Recommended Specs

| Deployment | CPU | RAM | Storage |
|-----------|-----|-----|---------|
| Development | 2 cores | 2 GB | 5 GB |
| Small hospital (< 100 beds) | 4 cores | 4 GB | 50 GB |
| Medium hospital (100-500 beds) | 8 cores | 8 GB | 100 GB |
| Large hospital (> 500 beds) | 16 cores | 16 GB | 200 GB |

---

## Troubleshooting

### Server Won't Start

```bash
# Check port in use
sudo lsof -i :4200

# Check Ruby
ruby --version

# Check Gems
bundle install

# Run with debug
RUBY_DEBUG=1 ruby server.rb
```

### High Memory Usage

```bash
# Check process
ps aux | grep ruby

# Memory profile
memory_profiler

# Reduce WEBrick clients
MaxClients: 100  # Reduce from 256
```

### Slow Response Times

```bash
# Check network
ping yourhospital.com
traceroute api.anthropic.com

# Check system
top
vmstat 1 5

# Check logs
tail -f logs/app.log
```

### SSL/TLS Errors

```bash
# Test certificate
openssl s_client -connect yourhospital.com:443

# Verify expiry
openssl x509 -in cert.pem -noout -dates

# Update certificates
certbot renew
```

---

## Post-Deployment Checklist

- [ ] Health check endpoint responds
- [ ] HTTPS working with valid certificate
- [ ] Authentication tokens generate correctly
- [ ] Rate limiting functional
- [ ] Audit logging writing to file
- [ ] Error messages are safe (no PII)
- [ ] Database backups scheduled
- [ ] Monitoring dashboards active
- [ ] Alerts configured
- [ ] On-call rotation established
- [ ] Clinical staff trained
- [ ] Documentation complete

---

**AZEDOC is ready for production deployment. Contact hospital IT for infrastructure questions.**
