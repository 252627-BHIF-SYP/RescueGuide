# VPN-only TURN deployment with pulled images

Coturn relays WebRTC media between the mobile app and Controlcenter. It binds to the RescueGuide VM at `192.168.6.10` and is intended to be reachable only through the existing VPN route. Do not add public router forwarding.

## 1. Publish the updated application images

The GitHub Actions workflow builds and publishes the backend and Controlcenter images to GHCR when changes are pushed to `main`:

- `ghcr.io/252627-bhif-syp/rescueguide-backend:latest`
- `ghcr.io/252627-bhif-syp/rescueguide-controlcenter:latest`

Commit and push the TURN changes to `main`, then wait for the `Build and Push Images` workflow to finish successfully. The mobile APK is built separately and installed on the phone.

## 2. Update the VM's Compose configuration once

The VM must have an updated Compose file that includes the `turn-server` service, passes `TURN_SHARED_SECRET` and the TURN URLs to the backend, and uses the GHCR image names above. Docker images do not contain or update this Compose configuration. Transfer the updated `infra/docker/docker-compose.yaml` and `infra/coturn/turn.conf` to the VM once, or make the same changes to the Compose/config files already used there.

## 3. Create the TURN secret on the VM

In the VM's `infra/docker` directory:

```bash
if [ ! -f .env ]; then cp turn.env.example .env; fi
openssl rand -hex 32
nano .env
```

Replace the example value after `TURN_SHARED_SECRET=` with the generated value. Keep `.env` on the VM; never commit or share it. Coturn validates temporary credentials with this secret, while the backend uses the same value to issue them. Do not change it independently in only one service.

## 4. Allow the VPN traffic

Allow inbound traffic from the VPN clients to `192.168.6.10`:

- UDP `3478` for TURN
- TCP `3478` as a fallback TURN transport
- UDP `49152-49252` for relayed media

Apply the rules in the VPN route/ACL and any active VM firewall. The current VM has UFW disabled. No public DNS record, TLS listener, or router port forwarding is needed.

## 5. Pull and restart services on the VM

After the workflow has published the images, and after the Compose/config files and `.env` are in place:

```bash
cd ~/RescueGuide/infra/docker
docker login ghcr.io
docker compose --env-file .env config -q
docker compose --env-file .env pull backend control-center signaling-server turn-server
docker compose --env-file .env up -d --no-build backend control-center signaling-server turn-server
docker compose logs --tail=100 turn-server backend
```

Authenticate with a GitHub token that can read the package if GHCR prompts for login. Coturn uses host networking and binds to `192.168.6.10`. Check the logs for address-binding or authentication errors.

## 6. Install the APK and verify

Install the newly built Flutter APK. Ensure the phone and Controlcenter are connected to the VPN, then start a call. In Firefox `about:webrtc`, the selected candidate pair should contain a relay candidate and ICE should reach `connected` or `completed`. If it remains failed, check VPN ACL/firewall access to UDP `3478` and `49152-49252`, then inspect `docker compose logs turn-server`.

Both clients request short-lived credentials from `GET /api/turn/credentials`; the API limits requests to 10 per minute per source IP. The shared secret is never sent to either client.
