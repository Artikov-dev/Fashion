# AWS EC2 Deployment Guide (PostgreSQL in Docker)

## Prerequisites
- AWS Account
- EC2 instance (Ubuntu 22.04 or later, t2.micro or larger)
- Basic understanding of Docker

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Instances → Launch Instances**
2. **Name**: `fashion-ecommerce`
3. **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
4. **Instance type**: `t2.micro` (free tier) or `t2.small` (recommended for production)
5. **Key pair**: Create/select your SSH key (download .pem file)
6. **Security group**: Create new security group
   - **Inbound rules**:
     - HTTP (80) from `0.0.0.0/0`
     - HTTPS (443) from `0.0.0.0/0` (optional, add SSL later)
     - SSH (22) from YOUR_IP only (for security)
7. **Storage**: 20 GB gp3 (sufficient for database + images)
8. Click **Launch Instance**

---

## Step 2: Connect to EC2 and Install Docker

### SSH into EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Update system
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### Install Docker & Docker Compose
```bash
sudo apt-get install -y docker.io docker-compose curl git
```

### Add user to docker group (run Docker without sudo)
```bash
sudo usermod -aG docker ubuntu
newgrp docker
```

### Verify installation
```bash
docker --version
docker compose version
```

---

## Step 3: Clone Repository & Configure

### Clone your project
```bash
git clone https://github.com/your-username/Fashion-Ecommerce-System.git
cd Fashion-Ecommerce-System/Fashion-Ecommerce-System
```

### Verify files
```bash
ls -la docker-compose.production.yml
cat .env.production
```

---

## Step 4: Deploy with Docker Compose

### Start all services (frontend, backend, PostgreSQL)
```bash
docker compose -f docker-compose.production.yml up -d --build
```

**What happens:**
- Builds backend Docker image (Flask + Gunicorn)
- Builds frontend Docker image (Vite + Nginx)
- Starts PostgreSQL container and initializes database
- Services connect automatically

### Check status
```bash
docker compose -f docker-compose.production.yml ps
```

**Expected output:**
```
NAME                   IMAGE               STATUS
fashion-db             postgres:15-alpine  Up 2 minutes (healthy)
fashion-backend        fashion-backend     Up 1 minute
fashion-frontend       fashion-frontend    Up 30 seconds
```

### View logs
```bash
# All logs
docker compose -f docker-compose.production.yml logs -f

# Backend only
docker compose -f docker-compose.production.yml logs -f backend

# Database only
docker compose -f docker-compose.production.yml logs -f db
```

---

## Step 5: Verify Deployment

### Test frontend (should show login page)
```bash
curl http://your-ec2-public-ip
```

### Test backend API
```bash
curl http://your-ec2-public-ip:8000/api/health
```

Expected response:
```json
{"status": "healthy", "database": "connected"}
```

### Access in browser
- **Frontend**: http://your-ec2-public-ip
- **Backend API**: http://your-ec2-public-ip:8000/swagger/ (API docs)

---

## Step 6: Configure Security Groups (Allow External Traffic)

### Update Security Group
1. Go to **AWS Console → EC2 → Security Groups**
2. Select your security group
3. **Edit Inbound Rules**:
   - HTTP (80) - Source: `0.0.0.0/0` ✅ (Already set)
   - HTTPS (443) - Source: `0.0.0.0/0` (optional)
   - SSH (22) - Source: YOUR_IP_ONLY (for security)

### Test connectivity
```bash
# From your local machine
curl http://your-ec2-public-ip
```

---

## Step 7: Enable Auto-Restart on Reboot

### Enable Docker service on boot
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### Create systemd service for auto-restart
```bash
sudo tee /etc/systemd/system/docker-compose-fashion.service > /dev/null <<EOF
[Unit]
Description=Fashion Ecommerce Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/Fashion-Ecommerce-System/Fashion-Ecommerce-System
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
Restart=always

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and start service
```bash
sudo systemctl enable docker-compose-fashion
sudo systemctl start docker-compose-fashion
sudo systemctl status docker-compose-fashion
```

Now containers will auto-restart if they crash or if EC2 reboots.

---

## Step 8: Backup PostgreSQL Database

### Create backup
```bash
docker compose -f docker-compose.production.yml exec db pg_dump -U fashion_user -d fashion_shop > backup.sql
```

### List backups
```bash
ls -lh backup.sql
```

### Restore from backup
```bash
docker compose -f docker-compose.production.yml exec -T db psql -U fashion_user -d fashion_shop < backup.sql
```

---

## Monitoring & Troubleshooting

### View all container logs
```bash
docker compose -f docker-compose.production.yml logs -f
```

### Restart services
```bash
# Restart all
docker compose -f docker-compose.production.yml restart

# Restart specific service
docker compose -f docker-compose.production.yml restart backend
docker compose -f docker-compose.production.yml restart frontend
```

### Stop all services
```bash
docker compose -f docker-compose.production.yml down
```

### Restart everything (fresh start)
```bash
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d --build
```

### Check disk usage
```bash
df -h
docker system df
```

### View database logs
```bash
docker compose -f docker-compose.production.yml logs db
```

### Connect to database directly
```bash
docker compose -f docker-compose.production.yml exec db psql -U fashion_user -d fashion_shop
```

---

## Common Issues & Solutions

### Problem: Port 80 already in use
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop nginx if running
sudo systemctl stop nginx

# Or use different port - edit docker-compose.production.yml:
# ports: - "8080:80"  (then access at http://your-ip:8080)
```

### Problem: Backend can't connect to database
```bash
# Check database is running
docker compose -f docker-compose.production.yml ps db

# View database logs
docker compose -f docker-compose.production.yml logs db

# Restart database
docker compose -f docker-compose.production.yml restart db
```

### Problem: Out of disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Or delete old containers/images
docker container prune
docker image prune
```

### Problem: Containers keep restarting
```bash
# Check backend logs for errors
docker compose -f docker-compose.production.yml logs backend

# Check frontend logs
docker compose -f docker-compose.production.yml logs frontend
```

### Problem: Can't access frontend at http://your-ip
```bash
# Check if frontend is running
docker compose -f docker-compose.production.yml ps frontend

# Check frontend logs
docker compose -f docker-compose.production.yml logs frontend

# Check if nginx is running inside container
docker compose -f docker-compose.production.yml exec frontend ps aux | grep nginx
```

---

## Optional: Set Up SSL/HTTPS with Let's Encrypt

### Install Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Get certificate
```bash
sudo certbot certonly --standalone -d your-domain.com
```

### Update nginx config to use SSL
- Edit nginx configuration in frontend container
- Or create nginx.conf before building the image

---

## Quick Reference Commands

```bash
# Deploy
docker compose -f docker-compose.production.yml up -d --build

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart services
docker compose -f docker-compose.production.yml restart

# Stop all services
docker compose -f docker-compose.production.yml down

# Connect to database
docker compose -f docker-compose.production.yml exec db psql -U fashion_user -d fashion_shop

# Backup database
docker compose -f docker-compose.production.yml exec db pg_dump -U fashion_user -d fashion_shop > backup.sql

# View specific service logs
docker compose -f docker-compose.production.yml logs backend
docker compose -f docker-compose.production.yml logs frontend
docker compose -f docker-compose.production.yml logs db
```

---

## Architecture Overview

```
AWS EC2 Instance (Ubuntu 22.04)
│
├── Docker Container: PostgreSQL 15
│   └── Volume: postgres_data_prod (persists database)
│
├── Docker Container: Backend (Flask)
│   ├── Port: 8000
│   └── Connects to: PostgreSQL
│
└── Docker Container: Frontend (Nginx)
    ├── Port: 80
    └── Proxies to: Backend
```

---

## Next Steps

- ✅ **Done**: Deployed on AWS EC2 with PostgreSQL in Docker
- 🔒 **Optional**: Set up SSL/HTTPS with Let's Encrypt
- 📊 **Optional**: Set up CloudWatch monitoring
- 🔄 **Optional**: Set up CI/CD pipeline (GitHub Actions)
- 📦 **Optional**: Push images to ECR or Docker Hub

---

## Environment Variables

Edit `.env.production` to customize:
```bash
FLASK_ENV=production          # Production mode
FLASK_CONFIG=production       # Flask config
SECRET_KEY=<your-secret>      # Keep this secret!
JWT_SECRET_KEY=<your-jwt>     # Keep this secret!
DATABASE_URL=<postgres-url>   # Auto-set by docker-compose
PORT=8000                     # Backend port
```

**Never commit `.env.production` to GitHub!** (Add to `.gitignore`)
