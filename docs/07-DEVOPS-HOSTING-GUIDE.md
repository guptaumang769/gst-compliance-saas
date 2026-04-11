# DevOps & Cloud Hosting Guide - GST Compliance SaaS

**Version:** 1.0  
**Date:** March 17, 2026  
**Target OS for Development:** Windows 10/11  
**Cloud Provider:** AWS (Free Tier wherever possible)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites - Windows Setup](#2-prerequisites---windows-setup)
3. [Local Development with Docker](#3-local-development-with-docker)
4. [AWS Account & Free Tier Setup](#4-aws-account--free-tier-setup)
5. [AWS Services We'll Use](#5-aws-services-well-use)
6. [Option A: Deploy with Docker on EC2 (Simplest)](#6-option-a-deploy-with-docker-on-ec2)
7. [Option B: Deploy with Kubernetes on EKS](#7-option-b-deploy-with-kubernetes-on-eks)
8. [Database Setup (RDS PostgreSQL)](#8-database-setup-rds-postgresql)
9. [S3 for File Storage](#9-s3-for-file-storage)
10. [Domain & SSL Setup](#10-domain--ssl-setup)
11. [CI/CD with GitHub Actions](#11-cicd-with-github-actions)
12. [CI/CD with Jenkins (Alternative)](#12-cicd-with-jenkins-alternative)
13. [Monitoring & Logging](#13-monitoring--logging)
14. [Cost Breakdown & Free Tier Limits](#14-cost-breakdown--free-tier-limits)
15. [Security Checklist](#15-security-checklist)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Architecture Overview

```
                    ┌─────────────────┐
                    │   Route 53      │  (Domain DNS)
                    │   (optional)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │  (ALB or Nginx on EC2)
                    │  + SSL (HTTPS)  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌──────────▼──────────┐
    │   Frontend (Nginx) │       │   Backend (Node.js)  │
    │   React SPA        │       │   Express API         │
    │   Port 80          │       │   Port 5000           │
    └───────────────────┘       └──────────┬──────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                ┌─────────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
                │  PostgreSQL    │  │   Redis    │  │  AWS S3     │
                │  (RDS/Docker)  │  │  (Docker)  │  │  (PDFs/JSON)│
                │  Port 5432     │  │  Port 6379 │  │             │
                └────────────────┘  └───────────┘  └─────────────┘
```

**What each service does:**
- **Frontend (Nginx)**: Serves the React app, proxies `/api` requests to backend
- **Backend (Node.js/Express)**: REST API, business logic, GST calculations
- **PostgreSQL**: Main database (users, invoices, GST returns, etc.)
- **Redis**: Caching, session storage, rate limiting
- **S3**: Stores invoice PDFs, GST return JSON files

---

## 2. Prerequisites - Windows Setup

### 2.1 Install Required Software

Open **PowerShell as Administrator** and run these one by one:

#### Install Chocolatey (Windows Package Manager)
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Install Tools
```powershell
# Docker Desktop (includes Docker Compose)
choco install docker-desktop -y

# Git
choco install git -y

# Node.js 20 LTS
choco install nodejs-lts -y

# AWS CLI
choco install awscli -y

# kubectl (for Kubernetes)
choco install kubernetes-cli -y

# Helm (Kubernetes package manager)
choco install kubernetes-helm -y
```

#### Restart your terminal after installation.

### 2.2 Verify Installations
```powershell
docker --version          # Docker version 24.x+
docker compose version    # Docker Compose version v2.x+
node --version            # v20.x+
npm --version             # v10.x+
git --version             # git version 2.x+
aws --version             # aws-cli/2.x+
kubectl version --client  # Client Version: v1.28+
```

### 2.3 Docker Desktop Configuration (Windows)
1. Open **Docker Desktop**
2. Go to **Settings** → **General**
3. Enable **"Use WSL 2 based engine"** (recommended)
4. Go to **Settings** → **Resources** → **WSL Integration**
5. Enable integration with your WSL distro
6. Apply & Restart

### 2.4 Clone the Repository
```powershell
cd C:\Projects
git clone <your-repo-url> gst-compliance-saas
cd gst-compliance-saas
```

---

## 3. Local Development with Docker

### 3.1 Environment Setup

Create the backend `.env` file:
```powershell
cd backend
copy .env.example .env
```

Edit `backend\.env` and fill in your values:
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/gst_saas
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.2 Start Infrastructure (Database + Redis)
```powershell
# From project root
docker compose up postgres redis -d
```

Verify they're running:
```powershell
docker compose ps
# Should show postgres and redis as "running"
```

### 3.3 Setup Database
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
# OR for migrations:
npx prisma migrate dev --name init
```

### 3.4 Run Backend & Frontend (Development)
```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3.5 Run Full Stack with Docker Compose
```powershell
# Build and start everything
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down
```

Access at `http://localhost` (port 80).

### 3.6 Useful Docker Commands (Windows PowerShell)
```powershell
# List running containers
docker ps

# Enter a container's shell
docker exec -it gst_saas_backend sh

# View container logs
docker logs gst_saas_backend --tail 50

# Restart a service
docker compose restart backend

# Rebuild a single service
docker compose up --build backend -d

# Remove everything including volumes (CAREFUL - deletes data)
docker compose down -v
```

---

## 4. AWS Account & Free Tier Setup

### 4.1 Create AWS Account
1. Go to https://aws.amazon.com/free/
2. Click **"Create a Free Account"**
3. Enter email, password, account name
4. Add a credit/debit card (required but won't be charged for free tier)
5. Choose **"Basic Support - Free"** plan
6. **Important:** Set up billing alerts to avoid surprise charges

### 4.2 Set Up Billing Alerts
```
AWS Console → Billing → Budgets → Create Budget
- Budget Type: Cost Budget
- Budget Amount: $5/month (to start)
- Alert: Email when 80% reached
```

### 4.3 Create IAM User (Don't Use Root Account)
```
AWS Console → IAM → Users → Create User
- Username: gst-saas-admin
- Access: AWS Management Console + Programmatic
- Attach policies:
  - AmazonEC2FullAccess
  - AmazonRDSFullAccess
  - AmazonS3FullAccess
  - AmazonECR_FullAccess (for Docker images)
  - AmazonEKS_CNI_Policy (if using Kubernetes)
- Download the access key CSV file (keep it safe!)
```

### 4.4 Configure AWS CLI (Windows)
```powershell
aws configure
# AWS Access Key ID: [paste from CSV]
# AWS Secret Access Key: [paste from CSV]
# Default region name: ap-south-1 (Mumbai - closest for India)
# Default output format: json
```

Verify:
```powershell
aws sts get-caller-identity
# Should show your account ID and user ARN
```

---

## 5. AWS Services We'll Use

| Service | Purpose | Free Tier | Cost After Free Tier |
|---------|---------|-----------|---------------------|
| **EC2** | Run Docker containers | 750 hrs/month t2.micro (12 months) | ~$8/month for t3.micro |
| **RDS** | PostgreSQL database | 750 hrs/month db.t3.micro (12 months) | ~$15/month |
| **S3** | Store PDFs, JSON files | 5 GB storage, 20K GET, 2K PUT/month | ~$0.023/GB |
| **ECR** | Docker image registry | 500 MB storage | ~$0.10/GB |
| **Route 53** | Domain DNS | Not free | $0.50/hosted zone/month |
| **CloudWatch** | Monitoring & Logs | 10 metrics, 5 GB logs | Pay per use |
| **EKS** | Kubernetes (optional) | NOT free ($0.10/hr = $72/month) | Use EC2 instead to save |

**Recommendation for starting free:** Use EC2 + RDS + S3. Skip EKS initially.

---

## 6. Option A: Deploy with Docker on EC2

This is the **simplest and cheapest** approach. Perfect for getting started.

### 6.1 Launch EC2 Instance

```
AWS Console → EC2 → Launch Instance

Settings:
- Name: gst-saas-server
- AMI: Amazon Linux 2023 (free tier eligible)
- Instance type: t2.micro (free tier) or t3.small (better, ~$15/month)
- Key pair: Create new → "gst-saas-key" → Download .pem file
- Network: Default VPC
- Security Group: Create new with these rules:
  - SSH (22) → My IP only
  - HTTP (80) → 0.0.0.0/0 (anywhere)
  - HTTPS (443) → 0.0.0.0/0 (anywhere)
  - Custom TCP (5000) → 0.0.0.0/0 (for API, optional)
- Storage: 20 GB gp3 (free tier allows 30 GB)
```

### 6.2 Connect to EC2 from Windows

Save the `.pem` key file to `C:\Users\<you>\.ssh\gst-saas-key.pem`

```powershell
# Connect via SSH
ssh -i C:\Users\<you>\.ssh\gst-saas-key.pem ec2-user@<your-ec2-public-ip>
```

Or use **PuTTY**:
1. Convert `.pem` to `.ppk` using PuTTYgen
2. Connect with PuTTY using the public IP

### 6.3 Install Docker on EC2

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install git -y

# Logout and login again for docker group to take effect
exit
```

Reconnect via SSH, then verify:
```bash
docker --version
docker-compose --version
```

### 6.4 Deploy the Application

```bash
# Clone your repository
git clone <your-repo-url> /home/ec2-user/gst-compliance-saas
cd /home/ec2-user/gst-compliance-saas

# Create .env file for backend
cat > backend/.env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:your-strong-password@postgres:5432/gst_saas
REDIS_URL=redis://redis:6379
JWT_SECRET=generate-a-256-bit-random-secret-here
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://your-ec2-public-ip
ALLOWED_ORIGINS=http://your-ec2-public-ip
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=gst-saas-documents
EOF

# Build and start all services
docker compose up --build -d

# Check everything is running
docker compose ps

# View logs
docker compose logs -f
```

### 6.5 Verify Deployment

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api
```

From your Windows browser, go to `http://<ec2-public-ip>`.

### 6.6 Auto-Start on Reboot

```bash
sudo systemctl enable docker

# Create a systemd service for auto-start
sudo cat > /etc/systemd/system/gst-saas.service << 'EOF'
[Unit]
Description=GST SaaS Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/gst-compliance-saas
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ec2-user

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable gst-saas
sudo systemctl start gst-saas
```

---

## 7. Option B: Deploy with Kubernetes on EKS

**Warning:** EKS costs $0.10/hour ($72/month) just for the control plane. Only use this if you want to learn Kubernetes. For production, EC2 with Docker Compose is cheaper for a small app.

### 7.1 Understanding Kubernetes Concepts

```
Kubernetes Hierarchy:
├── Cluster         (the entire K8s environment)
│   ├── Namespace   (logical separation, like environments)
│   │   ├── Deployment    (manages pods)
│   │   │   └── Pod       (one or more containers)
│   │   │       └── Container  (your Docker image)
│   │   ├── Service       (networking, load balancing)
│   │   ├── ConfigMap     (configuration)
│   │   ├── Secret        (sensitive data)
│   │   └── Ingress       (external access, routing)
│   └── PersistentVolume  (storage)
```

### 7.2 Create EKS Cluster

Install eksctl:
```powershell
choco install eksctl -y
```

Create cluster:
```powershell
eksctl create cluster `
  --name gst-saas-cluster `
  --region ap-south-1 `
  --nodegroup-name standard-workers `
  --node-type t3.small `
  --nodes 2 `
  --nodes-min 1 `
  --nodes-max 3
```

This takes 15-20 minutes. Verify:
```powershell
kubectl get nodes
```

### 7.3 Push Docker Images to ECR

```powershell
# Create ECR repositories
aws ecr create-repository --repository-name gst-saas-backend --region ap-south-1
aws ecr create-repository --repository-name gst-saas-frontend --region ap-south-1

# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Build and tag images
docker build -t gst-saas-backend ./backend
docker tag gst-saas-backend:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-backend:latest

docker build -t gst-saas-frontend ./frontend
docker tag gst-saas-frontend:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-frontend:latest

# Push images
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-backend:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-frontend:latest
```

### 7.4 Create Kubernetes Manifests

Create `k8s/` folder in your project root:

**k8s/namespace.yaml**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: gst-saas
```

**k8s/secrets.yaml** (encode values with base64)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gst-saas-secrets
  namespace: gst-saas
type: Opaque
data:
  DATABASE_URL: <base64-encoded-value>
  JWT_SECRET: <base64-encoded-value>
  RAZORPAY_KEY_ID: <base64-encoded-value>
  RAZORPAY_KEY_SECRET: <base64-encoded-value>
```

To encode on Windows:
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-value-here"))
```

**k8s/backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: gst-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - secretRef:
            name: gst-saas-secrets
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "5000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: gst-saas
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```

**k8s/frontend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: gst-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: gst-saas
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

### 7.5 Deploy to Kubernetes

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check status
kubectl get all -n gst-saas

# Get the external URL
kubectl get svc frontend-service -n gst-saas
```

### 7.6 Useful kubectl Commands

```powershell
# View pods
kubectl get pods -n gst-saas

# View pod logs
kubectl logs -f <pod-name> -n gst-saas

# Enter a pod
kubectl exec -it <pod-name> -n gst-saas -- sh

# Scale up/down
kubectl scale deployment backend --replicas=3 -n gst-saas

# View events (debugging)
kubectl get events -n gst-saas --sort-by='.lastTimestamp'

# Delete cluster (to stop costs)
eksctl delete cluster --name gst-saas-cluster --region ap-south-1
```

---

## 8. Database Setup (RDS PostgreSQL)

### 8.1 Create RDS Instance

```
AWS Console → RDS → Create Database

Settings:
- Engine: PostgreSQL 15
- Template: Free tier
- DB Instance Identifier: gst-saas-db
- Master Username: postgres
- Master Password: <strong-password>
- Instance Class: db.t3.micro (free tier)
- Storage: 20 GB (free tier allows 20 GB)
- Public Access: Yes (for development) / No (for production)
- VPC Security Group: Allow port 5432 from your EC2 security group
- Initial Database: gst_saas
```

### 8.2 Connect from EC2

Update your `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://postgres:<password>@<rds-endpoint>:5432/gst_saas
```

The RDS endpoint looks like: `gst-saas-db.xxxxxxxxxxxx.ap-south-1.rds.amazonaws.com`

### 8.3 Run Migrations

```bash
# SSH into EC2, then:
docker exec -it gst_saas_backend sh
npx prisma migrate deploy
```

### 8.4 Database Backup (Free)

RDS free tier includes:
- Automated backups (7-day retention)
- Manual snapshots

```
AWS Console → RDS → Your Instance → Maintenance → Backup
- Retention: 7 days
- Backup window: 03:00-04:00 UTC (off-peak hours)
```

---

## 9. S3 for File Storage

### 9.1 Create S3 Bucket

```powershell
aws s3 mb s3://gst-saas-documents-<your-unique-id> --region ap-south-1
```

Or via Console:
```
AWS Console → S3 → Create Bucket
- Bucket name: gst-saas-documents-<unique-id>
- Region: ap-south-1
- Block Public Access: ON (we use signed URLs)
- Versioning: Enable
- Encryption: SSE-S3
```

### 9.2 Create IAM Policy for S3 Access

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::gst-saas-documents-<your-id>",
                "arn:aws:s3:::gst-saas-documents-<your-id>/*"
            ]
        }
    ]
}
```

### 9.3 Bucket Structure

```
gst-saas-documents/
├── invoices/
│   ├── {businessId}/
│   │   ├── {invoiceId}.pdf
│   │   └── {invoiceId}.pdf
├── gst-returns/
│   ├── {businessId}/
│   │   ├── gstr1/
│   │   │   ├── 2026-01.json
│   │   │   └── 2026-02.json
│   │   └── gstr3b/
│   │       ├── 2026-01.json
│   │       └── 2026-02.json
└── logos/
    └── {businessId}/
        └── logo.png
```

---

## 10. Domain & SSL Setup

### 10.1 Get a Free Domain (Options)

| Provider | Cost | Notes |
|----------|------|-------|
| **Freenom** (.tk, .ml, .ga) | Free | Unreliable, good for testing |
| **GitHub Student** (.me) | Free (1 year) | If you're a student |
| **Namecheap** (.com) | ~$8/year | Most professional |
| **GoDaddy** (.com) | ~$10/year | Popular in India |
| **AWS Route 53** (.com) | $12/year | Integrated with AWS |

### 10.2 SSL with Let's Encrypt (Free HTTPS)

On your EC2 instance:

```bash
# Install Certbot
sudo yum install certbot -y

# Stop frontend container temporarily
docker compose stop frontend

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificate will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

Update your `frontend/nginx.conf` for SSL:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Auto-renew (add to crontab):
```bash
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker compose restart frontend
```

---

## 11. CI/CD with GitHub Actions

We already have `.github/workflows/ci.yml`. Here's how to set it up:

### 11.1 Add GitHub Secrets

```
GitHub → Your Repo → Settings → Secrets → Actions → New Repository Secret

Add these secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- EC2_HOST (your EC2 public IP or domain)
- EC2_SSH_KEY (contents of your .pem file)
- EC2_USERNAME (ec2-user)
- DOCKER_USERNAME (if using Docker Hub)
- DOCKER_PASSWORD (if using Docker Hub)
```

### 11.2 Add Deployment Job

Add this to `.github/workflows/ci.yml` after the `docker-build` job:

```yaml
  deploy:
    name: Deploy to EC2
    runs-on: ubuntu-latest
    needs: [docker-build]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/gst-compliance-saas
            git pull origin main
            docker compose down
            docker compose up --build -d
            docker compose ps
```

### 11.3 How CI/CD Works

```
Developer pushes code to GitHub
         │
         ▼
GitHub Actions triggers
         │
         ├── 1. Backend: Install deps → Run tests → Lint
         ├── 2. Frontend: Install deps → Build → Lint
         │
         ▼ (if both pass and branch is 'main')
         │
         ├── 3. Build Docker images
         │
         ▼ (if build passes)
         │
         └── 4. SSH into EC2 → git pull → docker compose up
                 │
                 ▼
         App is live with new changes!
```

---

## 12. CI/CD with Jenkins (Alternative)

### 12.1 Install Jenkins on EC2

```bash
# Install Java
sudo yum install java-17-amazon-corretto -y

# Add Jenkins repo
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

# Install Jenkins
sudo yum install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at `http://<ec2-ip>:8080` (add port 8080 to security group).

### 12.2 Jenkins Pipeline (Jenkinsfile)

Create `Jenkinsfile` in project root:

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE = 'docker compose'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: '<your-repo-url>'
            }
        }
        
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                    sh 'npm test -- --passWithNoTests --forceExit'
                }
            }
        }
        
        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Docker Build & Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh "${DOCKER_COMPOSE} down"
                sh "${DOCKER_COMPOSE} up --build -d"
                sh "${DOCKER_COMPOSE} ps"
            }
        }
    }
    
    post {
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
        success {
            echo 'Pipeline succeeded! Application deployed.'
        }
    }
}
```

### 12.3 GitHub Actions vs Jenkins

| Feature | GitHub Actions | Jenkins |
|---------|---------------|---------|
| **Cost** | Free for public repos, 2000 min/month private | Free (self-hosted) |
| **Setup** | Zero setup, just add YAML file | Install on EC2, configure |
| **Maintenance** | GitHub manages it | You manage the server |
| **Learning** | Easier to start | More powerful, more to learn |
| **Best for** | Small-medium projects | Enterprise, complex pipelines |

**Recommendation:** Start with GitHub Actions (simpler, free). Move to Jenkins when you need more control.

---

## 13. Monitoring & Logging

### 13.1 CloudWatch (Basic - Free Tier)

```bash
# Install CloudWatch Agent on EC2
sudo yum install amazon-cloudwatch-agent -y

# Configure basic monitoring
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

Free tier includes:
- 10 custom metrics
- 5 GB log data
- 3 dashboards

### 13.2 Docker Container Logging

```bash
# View live logs
docker compose logs -f --tail 100

# Save logs to file
docker compose logs > logs-$(date +%Y%m%d).txt
```

### 13.3 Application Health Monitoring

Create a simple health check script on EC2:

```bash
cat > /home/ec2-user/health-check.sh << 'EOF'
#!/bin/bash
HEALTH=$(curl -s http://localhost:5000/health)
STATUS=$(echo $HEALTH | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null)

if [ "$STATUS" != "OK" ]; then
    echo "$(date): Backend is DOWN! Restarting..."
    cd /home/ec2-user/gst-compliance-saas
    docker compose restart backend
fi
EOF

chmod +x /home/ec2-user/health-check.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /home/ec2-user/health-check.sh >> /var/log/gst-health.log 2>&1
```

---

## 14. Cost Breakdown & Free Tier Limits

### First 12 Months (AWS Free Tier)

| Service | Free Tier Limit | Our Usage | Cost |
|---------|----------------|-----------|------|
| EC2 (t2.micro) | 750 hrs/month | 24/7 = 730 hrs | **$0** |
| RDS (db.t3.micro) | 750 hrs/month | 24/7 = 730 hrs | **$0** |
| S3 | 5 GB + 20K requests | ~1 GB first year | **$0** |
| Data Transfer | 100 GB outbound | ~10 GB/month | **$0** |
| CloudWatch | 10 metrics + 5 GB logs | Basic monitoring | **$0** |
| **Total (Year 1)** | | | **$0/month** |

### After Free Tier Expires (Month 13+)

| Service | Spec | Monthly Cost |
|---------|------|-------------|
| EC2 (t3.micro) | 2 vCPU, 1 GB RAM | ~$8 |
| RDS (db.t3.micro) | PostgreSQL, 20 GB | ~$15 |
| S3 | 10 GB storage | ~$0.25 |
| Data Transfer | 50 GB outbound | ~$4 |
| Domain | .com domain | ~$1 (yearly amortized) |
| **Total (Post Free Tier)** | | **~$28/month** |

### Cost-Saving Tips
1. Use **Reserved Instances** for EC2/RDS (30-40% cheaper)
2. Stop EC2 when not in use (evenings/weekends during development)
3. Use **S3 Intelligent-Tiering** for automatic cost optimization
4. Set up **billing alerts** at $5, $10, $20

---

## 15. Security Checklist

### Before Going Live

- [ ] Change all default passwords (PostgreSQL, JWT secret)
- [ ] Use environment variables for ALL secrets (never commit `.env`)
- [ ] Enable HTTPS (SSL/TLS) using Let's Encrypt
- [ ] Set `NODE_ENV=production` in backend
- [ ] Restrict EC2 security group (SSH from your IP only)
- [ ] Disable RDS public access (backend connects via VPC)
- [ ] Enable RDS encryption at rest
- [ ] Enable S3 bucket versioning and encryption
- [ ] Set up AWS CloudTrail for audit logging
- [ ] Use IAM roles (not root account) for everything
- [ ] Add rate limiting headers to API (already in backend with `express-rate-limit`)
- [ ] Keep `helmet` middleware enabled (already in backend)
- [ ] Regularly update dependencies (`npm audit fix`)
- [ ] Set up automated database backups
- [ ] Test password reset and email verification flows

### Generate Strong Secrets (PowerShell)

```powershell
# Generate JWT Secret (64 characters)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

# Generate Database Password (32 characters)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
```

---

## 16. Troubleshooting

### Common Issues on Windows

**Docker Desktop won't start:**
```powershell
# Ensure Hyper-V is enabled
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All

# Or enable WSL 2
wsl --install
wsl --set-default-version 2
```

**Port already in use:**
```powershell
# Find what's using port 5000
netstat -aon | findstr :5000

# Kill the process
taskkill /PID <pid> /F
```

**npm install fails on Windows:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Common Issues on EC2

**Cannot connect via SSH:**
```bash
# Check security group allows port 22 from your IP
# Check .pem file permissions
chmod 400 gst-saas-key.pem   # Linux/Mac
# On Windows, right-click .pem → Properties → Security → remove all except your user
```

**Docker containers keep restarting:**
```bash
# Check logs
docker compose logs backend --tail 50

# Common fix: database not ready yet
docker compose down
docker compose up postgres redis -d
sleep 10
docker compose up --build -d
```

**Database connection refused:**
```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check database URL
docker exec -it gst_saas_backend sh
echo $DATABASE_URL

# Test connection
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "SELECT 1;"
```

**Out of disk space on EC2:**
```bash
# Check disk usage
df -h

# Clean Docker cache
docker system prune -a --volumes

# Clean old logs
sudo journalctl --vacuum-time=7d
```

**Prisma migration fails:**
```bash
# Reset database (CAUTION: deletes all data)
docker exec -it gst_saas_backend sh
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

## Quick Reference Commands

### Windows PowerShell
```powershell
# Start local development
docker compose up postgres redis -d
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# Deploy full stack locally
docker compose up --build -d

# Connect to EC2
ssh -i ~/.ssh/gst-saas-key.pem ec2-user@<ip>

# Push Docker image to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com
docker build -t gst-saas-backend ./backend
docker tag gst-saas-backend:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-backend:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/gst-saas-backend:latest
```

### EC2 (Linux)
```bash
# Check app status
docker compose ps
docker compose logs -f --tail 50

# Update and redeploy
git pull origin main
docker compose up --build -d

# Database backup
docker exec gst_saas_db pg_dump -U postgres gst_saas > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i gst_saas_db psql -U postgres gst_saas < backup-20260317.sql
```

---

**Next Steps:**
1. Set up AWS account and configure billing alerts
2. Deploy locally with Docker Compose first
3. Launch EC2 instance and deploy
4. Set up RDS for production database
5. Configure S3 for file storage
6. Add SSL certificate
7. Set up CI/CD with GitHub Actions
8. Monitor and iterate

**You're ready to go live!**
