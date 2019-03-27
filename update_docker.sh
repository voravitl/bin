docker pull deviavir/zenbot:unstable
docker-compose -f /opt/zenbot/docker-compose.yml up -d --force-recreate server 
docker exec -it zenbot_server_1 apk add tzdata
#docker commit zenbot_server_1 voravitl/zenbot:unstable
