docker pull deviavir/zenbot:unstable
docker-compose up -d --force-recreate server  -f /opt/zenbot/docker-compose.yaml
docker exec -it zenbot_server_1 apk add tzdata
#docker commit zenbot_server_1 voravitl/zenbot:unstable
