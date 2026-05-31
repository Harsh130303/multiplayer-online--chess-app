# 📓 AWS EC2 Deployment Journal & Troubleshooting Guide

This document preserves the exact history of our AWS deployment journey, the specific challenges we encountered, and the engineering solutions used to resolve them. Keep this file in your repository as a reference for future cloud deployments, technical interviews, or resume write-ups!

---

## 🛠️ Summary of What We Did
We successfully deployed the containerized **FastAPI + React Chess Application** with a **PostgreSQL** database on a single **AWS EC2 (Ubuntu 26.04 LTS)** virtual machine.
1.  **Standardized Database Connections**: Refactored `app/db.py` and `README.md` to use PostgreSQL as the primary database for both development and production.
2.  **Containerized Orchestration**: Wrote a multi-container `docker-compose.yml` to run the web application (built from a multi-stage Dockerfile) and a PostgreSQL database side-by-side with volume-based storage persistence.
3.  **Server Provisioning**: Built the Docker runtime environment on AWS, fetched code, and configured production environmental secrets (`.env`).
4.  **Reverse Proxy Mapping**: Installed Nginx to proxy secure real-time WebSockets and web traffic directly to your backend port (`8080`).

---

## 🛑 Troubleshooting Journal: 5 Lessons We Learned

### 1. The SSH Connection Timeout (Firewall Port Lock)
*   **The Problem**: Running `ssh -i chess-key.pem ubuntu@<IP>` returned `Connection timed out` on Port 22.
*   **The Cause**: The AWS Security Group was configured to restrict SSH access to "My IP". However, dynamic home network IP configurations, VPNs, or ISP routing caused your current computer's public IP to mismatch what AWS initially recorded, causing the firewall to block your connection.
*   **The Solution**: Edited the Security Group Inbound Rules in the AWS Console, changing the SSH source from "My IP" to **"Anywhere-IPv4" (`0.0.0.0/0`)**.
*   **Key Lesson**: While "My IP" is safer, dynamic IPs frequently break SSH connections. Leaving it open to `0.0.0.0/0` is secure as long as you rely on highly encrypted Private Key Authentication (`.pem` keys) rather than simple passwords.

---

### 2. Docker Package Mismatch on Ubuntu 26.04 LTS
*   **The Problem**: Running `sudo apt install -y docker.io` failed with `no installation candidate` on the server.
*   **The Cause**: Ubuntu 26.04 LTS is a brand-new release. Standard mirror package directories had not yet fully indexed or configured the legacy `docker.io` community package names.
*   **The Solution**: Used the official Docker convenience script:
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```
*   **Key Lesson**: Never rely solely on default OS repositories for rapidly evolving container engines. Using the vendor's official install script is a bulletproof way to get the latest stable Docker Community Edition (`docker-ce`) on any Linux version.

---

### 3. The Double-@ Database Connection Trap
*   **The Problem**: The web application container crashed on startup, throwing the database connection error:
    `could not translate host name "13@db" to address: Name or service not known`
*   **The Cause**: The database password inside the `.env` file contained a special character (**`@`**). When mapped inside `docker-compose.yml` into a unified URL format:
    `postgresql://user:password@13@db:5432/dbname`
    the connection driver (`psycopg2`) split the URL at the wrong `@` character and mistook `"13@db"` for the server's hostname!
*   **The Solution**: Modified the `.env` file, changing the `POSTGRES_PASSWORD` to be strictly **alphanumeric** (letters and numbers only, with no special symbols like `@`, `:`, `/`, or `?`).
*   **Key Lesson**: Connection URLs are parsed using strict regex split rules. Alphanumeric passwords prevent string collision bugs during runtime parsing.

---

### 4. Database Volume Cache Stale-lock
*   **The Problem**: After updating the password inside `.env` and restarting containers, the web app still crashed, throwing the database authentication error:
    `FATAL: password authentication failed for user "postgres"`
*   **The Cause**: On the very first run, PostgreSQL had already initialized its database directory in the persistent Docker volume (`postgres_data`) using the *old* password. On subsequent restarts, PostgreSQL saw this existing directory and skipped initialization, retaining the old password internally. Thus, the web app's new password mismatched the database's cached password.
*   **The Solution**: Purged the volume entirely to force a clean startup:
    ```bash
    docker compose down -v
    docker compose up -d
    ```
*   **Key Lesson**: Changing database environment variables does not update existing database cluster storage files. During early development, the fastest way to sync credentials is to wipe the container volume with the `-v` flag.

---

### 5. WebSocket Connection Dropping (Nginx Proxy Timeouts)
*   **The Problem**: WebSockets dropped connections and players got disconnected after about 60 seconds of in-game thinking.
*   **The Cause**: Nginx has a default connection inactivity limit of 60 seconds. A WebSocket connection that doesn't send active packets within this frame is automatically terminated by the proxy.
*   **The Solution**: Configured custom Nginx headers to handle WebSockets upgrades, and increased read/write proxy timeouts to 1 hour:
    ```nginx
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    ```
*   **Key Lesson**: Real-time persistent connection channels require specialized proxy parameters to bypass default HTTP timeouts.

---

### 6. The Browser HTTPS Auto-Upgrade Trap (Port 80 vs 443)
*   **The Problem**: After successful deployment, opening the EC2 public IP address in the browser resulted in the site spinning and failing to open, even though Nginx and Docker containers were active and running.
*   **The Cause**: Modern web browsers (like Chrome, Edge, and Safari) aggressively upgrade raw IP connection attempts to secure HTTPS (`https://`) by default. Because Port 443 (HTTPS) and SSL/TLS certificates were not yet set up, the browser attempted to connect to Port 443, resulting in a connection timeout.
*   **The Solution**: Explicitly prepended **`http://`** to the IP address (e.g., `http://3.109.132.89`) or used a fresh **Incognito / Private Window** to bypass the browser's automatic HTTPS redirection.
*   **Key Lesson**: When testing fresh, non-SSL cloud deployments, always explicitly specify the `http://` protocol or use Incognito mode to bypass aggressive browser-enforced HTTPS upgrades.

