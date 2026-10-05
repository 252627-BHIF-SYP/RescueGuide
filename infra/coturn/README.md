# VPN-only TURN deployment

Coturn relays WebRTC media between the mobile app and Controlcenter. This deployment binds it to the RescueGuide VM at `192.168.6.10` and is intended to be reachable only through the existing VPN route. Do not add public router forwarding.

## 1. Create the shared secret on the VM

From the repository's `infra/docker` directory, create an ignored environment file and generate a secret locally:

```bash
cp turn.env.example .env
openssl rand -hex 32
```

Put the generated value after `TURN_SHARED_SECRET=` in `infra/docker/.env`. Keep this file on the VM and do not commit or share it. Coturn uses the secret to validate time-limited credentials; the backend uses the same value to generate them.

## 2. Allow VPN traffic to the VM

The VM must receive these inbound ports from the VPN clients:

- UDP `3478` for TURN
- UDP `49152-49252` for relayed media
- TCP `3478` as a fallback TURN transport

Allow these ports in the VM firewall and the VPN route/ACL. Restrict access to the VPN client network. No public DNS record, TLS listener, or router port forwarding is used. The current VM has UFW disabled; do not enable it without adding the required VPN-scoped rules first.

## 3. Start the services

On the VM:

```bash
cd ~/RescueGuide/infra/docker
docker compose --env-file .env config -q
docker compose --env-file .env up -d --build backend turn-server
docker compose logs -f turn-server backend
```

The backend needs the shared secret and TURN URLs from Compose. Coturn runs with host networking and binds to `192.168.6.10`. Confirm it starts without address-binding or configuration errors.

## 4. Deploy the clients

Build and deploy the Controlcenter with the repository's normal Compose deployment. Build a new Flutter APK after pulling the change; the mobile app calls the backend on `192.168.6.10:5001` for short-lived TURN credentials before creating its peer connection.

Both clients receive the same TURN URLs and temporary username/credential from `GET /api/turn/credentials`. The API limits this endpoint to 10 requests per minute per source IP. The shared secret is never sent to either client.

## 5. Verify

Make sure both devices are connected to the VPN. Start a call and inspect Firefox `about:webrtc`; the selected candidate pair should include a relay candidate. The ICE state should become `connected` or `completed`. If it stays failed, check the VPN ACL/firewall for UDP `3478` and `49152-49252`, then inspect `docker compose logs turn-server`.
