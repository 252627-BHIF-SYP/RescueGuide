# VPN-only TURN deployment with pulled images

Coturn relays WebRTC media between the mobile app and Controlcenter. It binds to the RescueGuide VM at `192.168.6.10` and is intended to be reachable only through the existing VPN route. Do not add public router forwarding.

## 1. Publish the updated application images

The GitHub Actions workflow builds and publishes the backend and Controlcenter images to GHCR when changes are pushed to `main`:

- `ghcr.io/252627-bhif-syp/rescueguide-backend:latest`
- `ghcr.io/252627-bhif-syp/rescueguide-controlcenter:latest`

Commit and push the TURN changes to `main`, then wait for the `Build and Push Images` workflow to finish successfully. The mobile APK is built separately and installed on the phone.

## 2. Update the VM's Compose configuration

The Docker images do not contain the Compose file or Coturn configuration. From Windows PowerShell at the repository root, transfer the updated files to the VM:

```powershell
scp infra/docker/docker-compose.yaml rescueguide@rescueguide:~/RescueGuide/infra/docker/docker-compose.yaml
scp infra/coturn/turn.conf rescueguide@rescueguide:~/RescueGuide/infra/coturn/turn.conf
```

The existing containers use Compose project name `rescueguide` and Docker network `rescueguide_default`; the Compose file declares that network as external to avoid creating a second network. Always pass `-p rescueguide` when running Compose from the nested directory.

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

After GitHub Actions has published the images and the Compose/config files and `.env` are in place:

```bash
cd ~/RescueGuide/infra/docker
docker compose -p rescueguide --env-file .env config -q
docker compose -p rescueguide --env-file .env pull backend control-center signaling-server turn-server
docker compose -p rescueguide --env-file .env up -d --no-build --no-deps backend control-center signaling-server turn-server
docker compose -p rescueguide --env-file .env ps
docker compose -p rescueguide --env-file .env logs --tail=100 turn-server backend
```

The Compose file attaches to the existing external Docker network `rescueguide_default`. Authenticate with `docker login ghcr.io` using a GitHub token that can read the package if GHCR prompts for login. The update deliberately omits `db` and `client-app`: the existing database must not be recreated, and the client image does not need rebuilding. Coturn uses host networking and binds to `192.168.6.10`. Check the logs for address-binding or authentication errors.

## 6. Install the APK and verify

Install the newly built Flutter APK. Ensure the phone and Controlcenter are connected to the VPN, then start a call. In Firefox `about:webrtc`, the selected candidate pair should contain a relay candidate and ICE should reach `connected` or `completed`. If it remains failed, check VPN ACL/firewall access to UDP `3478` and `49152-49252`, then inspect `docker compose logs turn-server`.

Both clients request short-lived credentials from `GET /api/turn/credentials`; the API limits requests to 10 per minute per source IP. The shared secret is never sent to either client.
