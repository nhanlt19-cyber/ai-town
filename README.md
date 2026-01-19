# AI Town - Deployment Guide on Ubuntu 24 🏠💻💌

This is a detailed guide to deploy the AI Town project on an Ubuntu 24 server with IP `10.0.12.81` and access it from your laptop via that IP.

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Install Required Tools](#install-required-tools)
- [Project Setup](#project-setup)
- [IP & Firewall Configuration](#ip--firewall-configuration)
- [Install & Configure Ollama](#install--configure-ollama)
- [Deploy with Docker Compose](#deploy-with-docker-compose)
- [Access from Laptop](#access-from-laptop)
- [View Agents UI & Status](#view-agents-ui--status-)
- [How to Use the Frontend UI](#how-to-use-the-frontend-ui-)
- [Service Management](#service-management)
- [Troubleshooting](#troubleshooting)

## 📖 Overview

AI Town is a virtual town where AI characters live, chat, and socialize. This project uses:
- **Backend**: Convex (self-hosted or cloud)
- **Frontend**: React + Vite + PixiJS
- **LLM**: Ollama (default) or OpenAI/Together.ai
- **Container**: Docker Compose

### ✨ Viewing Running Agents

When deployed with Docker, you can view running agents via:
1. **Game UI** (`http://10.0.12.81:5173`) - visually see agents moving and chatting
2. **Convex Dashboard** (`http://10.0.12.81:6791`) - view data, logs, and agent state in the database

See details in [View Agents UI & Status](#view-agents-ui--status-).

## 🖥️ System Requirements

- **OS**: Ubuntu 24.04 LTS
- **RAM**: Minimum 4GB (recommended 8GB+)
- **Disk**: Minimum 10GB free
- **Network**: Static IP `10.0.12.81` configured
- **Access**: sudo/root privileges

## 🔧 Install Required Tools

### 1) Update system packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2) Install Git

```bash
sudo apt install git -y
```

### 3) Install Node.js and npm

Install Node.js 18 (recommended stable for this project):

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash

# Reload shell configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify versions
node --version  # Should show v18.x.x
npm --version
```

### 4) Install Docker and Docker Compose

```bash
# Prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow current user to run docker without sudo
sudo usermod -aG docker $USER

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Verify
docker --version
docker compose version

# Apply group change without logout (optional)
newgrp docker
```

### 5) Install Python (if needed)

```bash
sudo apt install -y python3 python3-pip
```

## 📦 Project Setup

### 1) Clone repository

```bash
cd ~
git clone https://github.com/a16z-infra/ai-town.git
cd ai-town
```

### 2) Install dependencies

```bash
npm install
```

## 🔒 IP & Firewall Configuration

### 1) Check your IP

```bash
ip addr show
# or
hostname -I
```

Make sure `10.0.12.81` is configured. If not, configure your network interface first.

### 2) Configure UFW firewall

Open required ports:

```bash
# SSH
sudo ufw allow 22/tcp

# Frontend
sudo ufw allow 5173/tcp

# Convex backend
sudo ufw allow 3210/tcp

# Convex HTTP API
sudo ufw allow 3211/tcp

# Convex dashboard
sudo ufw allow 6791/tcp

# Ollama
sudo ufw allow 11434/tcp

# Enable firewall
sudo ufw enable

# Status
sudo ufw status
```

### 3) (Optional) Bind Docker services with a specific IP via `.env`

Create `.env`:

```bash
cd ~/ai-town
nano .env
```

Add:

```env
# Server IP
URL_BASE=http://10.0.12.81

# Ports
PORT=3210
SITE_PROXY_PORT=3211
DASHBOARD_PORT=6791
OLLAMA_PORT=11434
```

## 🤖 Install & Configure Ollama

### 1) Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Or manual:
# wget https://ollama.com/download/ollama-linux-amd64
# chmod +x ollama-linux-amd64
# sudo mv ollama-linux-amd64 /usr/local/bin/ollama
```

### 2) Create a systemd service for Ollama

```bash
sudo nano /etc/systemd/system/ollama.service
```

Paste:

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ollama
Group=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Create an `ollama` user:

```bash
sudo useradd -r -s /bin/false ollama
sudo mkdir -p /usr/share/ollama
sudo chown ollama:ollama /usr/share/ollama
```

Enable and start:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

### 3) Configure Ollama to listen on all interfaces

By default, Ollama may only listen on localhost. To allow remote access:

```bash
mkdir -p ~/.ollama
nano ~/.ollama/config
```

Add:

```env
OLLAMA_HOST=0.0.0.0:11434
```

Or export an environment variable:

```bash
echo 'export OLLAMA_HOST=0.0.0.0:11434' >> ~/.bashrc
source ~/.bashrc
```

### 4) Pull models

```bash
# Default chat model
ollama pull llama3

# Embedding model
ollama pull mxbai-embed-large

# List installed models
ollama list
```

### 5) Verify Ollama

```bash
curl http://localhost:11434
curl http://10.0.12.81:11434
ollama run llama3 "Hello, how are you?"
```

## 🐳 Deploy with Docker Compose

### 1) Create `.env.local` (if not exists)

```bash
cd ~/ai-town
nano .env.local
```

Add:

```env
# Convex self-hosted configuration
CONVEX_SELF_HOSTED_URL=http://10.0.12.81:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=""

# Ollama configuration
OLLAMA_HOST=http://10.0.12.81:11434

# Frontend URL
VITE_CONVEX_URL=http://10.0.12.81:3210
```

### 2) Update `docker-compose.yml` to use the server IP for frontend

Make sure frontend uses:

```yaml
frontend:
  environment:
    - VITE_CONVEX_URL=http://10.0.12.81:3210
```

### 3) Build and start services

```bash
cd ~/ai-town
docker compose up --build -d
docker compose logs -f
```

### 4) Generate Convex admin key

```bash
docker compose exec backend ./generate_admin_key.sh
```

Put the key into `.env.local`:

```bash
nano .env.local
```

```env
CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key>"
```

### 5) Configure Convex environment variables

> **Important**: running `convex env set` often fails on Node.js v18 (Convex CLI requires Node.js v20+). The easiest path is using the **Dashboard**.

#### Option A (recommended): Set via Convex Dashboard

1. Open: `http://10.0.12.81:6791`
2. Log in with the admin key
3. Settings → Environment Variables
4. Add:
   - Key: `OLLAMA_HOST`
   - Value: `http://10.0.12.81:11434` (or `http://host.docker.internal:11434` if you configured it)

#### Option B: Set via CLI (requires Node.js v20+)

If you need CLI:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Install convex CLI
npm install -g convex
```

Then:

```bash
cd ~/ai-town
convex env set OLLAMA_HOST http://10.0.12.81:11434
```

#### Option C: Linux `host.docker.internal`

On Linux, `host.docker.internal` is not available by default. If needed, add in `docker-compose.yml` (backend service):

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Restart:

```bash
docker compose down
docker compose up -d
```

### 6) Initialize database

> **Recommended**: run `init` from the Dashboard if CLI is problematic.

#### Option A (recommended): Run `init` via Dashboard

1. Dashboard: `http://10.0.12.81:6791`
2. Functions → run `testing:resume` (if world is inactive)
3. Functions → run `init`

#### Option B: CLI (Node.js v20+)

```bash
cd ~/ai-town
convex dev --run init --until-success
```

## 💻 Access from Laptop

Ensure your laptop can reach the server:
- `ping 10.0.12.81`
- firewall ports are open

Access URLs:
- **Frontend**: `http://10.0.12.81:5173`
- **Convex Dashboard**: `http://10.0.12.81:6791`
- **Convex Backend API**: `http://10.0.12.81:3210`
- **Convex HTTP API**: `http://10.0.12.81:3211`
- **Ollama API**: `http://10.0.12.81:11434`

Quick tests:

```bash
curl http://10.0.12.81:5173
curl http://10.0.12.81:3210/version
curl http://10.0.12.81:11434
```

## 👀 View Agents UI & Status 👀

When using Docker deployment, you have **two main ways** to see running agents:

### 1) Game UI (Frontend) - Most visual

Open: `http://10.0.12.81:5173`

You can:
- see agents moving in real-time
- see conversations between agents
- click characters to inspect details and chat history

### 2) Convex Dashboard - Data & logs

Open: `http://10.0.12.81:6791` and log in with admin key.

Useful tables:
- `worlds` (contains active players/agents)
- `agentDescriptions`
- `memories`
- `worldStatus`

Logs:
- Dashboard → Logs (to track engine/agent behavior)

## 🎮 How to Use the Frontend UI 🎮

Open: `http://10.0.12.81:5173`

### Spectating (no login required)

- **Click + drag** to move around the town
- **Scroll** to zoom in/out
- Click a character to see chat history

### Interactivity (requires login)

If you have auth configured:
- Click **Interact** to spawn your character
- Click to move
- Click an agent → **Start conversation** to talk
- Close chat panel or walk away to leave
- Max 8 humans simultaneously
- If idle for 5 minutes, you’ll be removed from the simulation

## 🔄 Service Management

```bash
cd ~/ai-town
docker compose stop
docker compose start
docker compose down
docker compose logs -f
docker compose restart frontend
docker compose restart backend
```

## 🐛 Troubleshooting

### Backend starts `unhealthy` then becomes `healthy`

This is typically normal while Convex boots up and its `/version` endpoint becomes available.

### Port 11434 already in use

Ollama is already bound on the host. Don’t map 11434 from Docker; let backend connect to host Ollama.

### `Invalid deployment address` (VITE_CONVEX_URL format)

Correct format: `http://IP:PORT` (must contain `:`), e.g. `http://10.0.12.81:3210`.

### `Unexpected non-whitespace character after JSON` when interacting

Usually Ollama embeddings response is not valid JSON because the embedding model isn’t pulled.

Fix:

```bash
ollama pull mxbai-embed-large
curl http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","prompt":"test"}'
docker compose restart backend
```

### Convex transaction conflict (`engines` table changed)

This can be transient due to concurrent engine updates. If it persists, run `testing:kick` or restart backend.

## 📚 References

- [Convex Documentation](https://docs.convex.dev)
- [Ollama Documentation](https://ollama.ai)
- [Docker Documentation](https://docs.docker.com)
- [AI Town GitHub](https://github.com/a16z-infra/ai-town)

---

**Good luck with your deployment!**


