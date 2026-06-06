# AWS EC2 Deployment Guide

## Prerequisites
- AWS Account
- EC2 instance (Ubuntu 22.04 or later, t2.micro or larger)
- RDS PostgreSQL instance (or use docker postgres in container)

---

## Step 1: Set Up AWS RDS PostgreSQL (Recommended)

### Create RDS Instance
1. Go to **AWS Console → RDS → Databases → Create Database**
2. Choose **PostgreSQL** engine (version 15+)
3. **DB instance identifier**: `fashion-db`
4. **Master username**: `fashion_user`
5. **Master password**: Set a strong password (save it!)
6. **DB name**: `fashion_shop`
7. **Publicly accessible**: NO (only EC2 accesses it)
8. **VPC**: Same VPC as your EC2 instance
9. Click **Create Database** (takes 5-10 minutes)

### Get RDS Endpoint
After RDS is created:
1. Open the RDS instance details
2. Copy the **Endpoint** (e.g., `fashion-db.c9akciq32.us-east-1.rds.amazonaws.com`)
3. Note the port (default: 5432)

---

## Step 2: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Instances → Launch Instances**
2. **Name**: `fashion-ecommerce`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance type**: `t2.medium` (or larger for production)
5. **Key pair**: Create/select your SSH key
6. **Security group**: Create new or use existing
   - **Inbound rules**:
     - HTTP (80) from `0.0.0.0/0`
     - HTTPS (443) from `0.0.0.0/0` (optional, add SSL later)
     - SSH (22) from YOUR_IP only
7. **Storage**: 30 GB gp3 (general purpose)
8. Click **Launch Instance**

---

## Step 3: Connect to EC2 and Install Docker

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
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
newgrp docker
```

### Verify installation
```bash
docker --version
docker compose version
```

---

## Step 4: Clone Repository & Configure

### Clone your project
```bash
git clone https://github.com/your-username/Fashion-Ecommerce-System.git
cd Fashion-Ecommerce-System/Fashion-Ecommerce-System
```

### Update `.env.production` with RDS credentials
```bash
nano .env.production
```

Update this line with your RDS endpoint and password:
```
DATABASE_URL=postgresql://fashion_user:YOUR_PASSWORD@your-rds-endpoint:5432/fashion_shop
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 5: Build & Deploy Containers

### Build images (optional - skipped if pulling from ECR)
```bash
sudo docker compose -f docker-compose.production.yml build
```

### Start services
```bash
sudo docker compose -f docker-compose.production.yml up -d
```

### Verify services are running
```bash
sudo docker compose -f docker-compose.production.yml ps
```

### Check logs
```bash
sudo docker compose -f docker-compose.production.yml logs -f backend
sudo docker compose -f docker-compose.production.yml logs -f frontend
```

---

## Step 6: Configure Security Groups

### RDS Security Group
1. Go to **RDS → Databases → fashion-db → Security groups**
2. Edit **Inbound rules**:
   - Add rule: **Type**: PostgreSQL, **Source**: EC2 security group (or EC2 private IP + /32)

### EC2 Security Group
Already configured to allow HTTP/HTTPS/SSH

---

## Step 7: Verify Deployment

### Test frontend
```bash
curl http://your-ec2-public-ip
```

### Test backend
```bash
curl http://your-ec2-public-ip:8000/api/health
```

### Access in browser
- Frontend: `http://your-ec2-public-ip`
- API: `http://your-ec2-public-ip:8000`

---

## Step 8: (Optional) Set Up Auto-Restart & Logs

### Enable Docker to start on boot
```bash
sudo systemctl enable docker
sudo systemctl enable docker.service
```

### Create systemd service (auto-restart containers)
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

sudo systemctl enable docker-compose-fashion
sudo systemctl start docker-compose-fashion
```

### View service status
```bash
sudo systemctl status docker-compose-fashion
```

---

## Monitoring & Troubleshooting

### View all container logs
```bash
sudo docker compose -f docker-compose.production.yml logs -f
```

### Restart services
```bash
sudo docker compose -f docker-compose.production.yml restart
```

### Stop all services
```bash
sudo docker compose -f docker-compose.production.yml down
```

### Check disk usage
```bash
df -h
docker system df
```

### Database connection test
```bash
sudo docker compose -f docker-compose.production.yml exec backend psql -U fashion_user -h <RDS_ENDPOINT> -d fashion_shop -c "SELECT 1"
```

---

## Optional: Use AWS ECR for Images

### Create ECR repositories
```bash
aws ecr create-repository --repository-name fashion-backend --region us-east-1
aws ecr create-repository --repository-name fashion-frontend --region us-east-1
```

### Login to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Build & push images
```bash
docker build -t fashion-backend ./backend
docker tag fashion-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-backend:latest

docker build -t fashion-frontend ./frontend
docker tag fashion-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend:latest
```

### Update docker-compose.production.yml to use ECR
```yaml
services:
  backend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-backend:latest
  frontend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend:latest
```

---

## Quick Reference Commands

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Start/stop containers
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml down

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart specific service
docker compose -f docker-compose.production.yml restart backend
docker compose -f docker-compose.production.yml restart frontend

# Check running containers
docker ps
```

---

## Troubleshooting

### Backend can't connect to RDS
- Check RDS security group allows EC2 security group
- Verify DATABASE_URL in .env.production
- Test connection: `psql -U fashion_user -h <RDS_ENDPOINT> -d fashion_shop`

### Port 80 already in use
- Check: `sudo lsof -i :80`
- Stop nginx/apache: `sudo systemctl stop nginx`

### Out of disk space
- Check: `df -h`
- Clean Docker: `docker system prune -a`

### Containers keep restarting
- Check logs: `docker compose logs backend`
- Check environment variables are set correctly

---

## Next Steps

- Set up CloudFront CDN for frontend
- Configure Route 53 DNS
- Set up SSL with ACM Certificate Manager
- Enable CloudWatch monitoring
- Configure backup strategy for RDS
