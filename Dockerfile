FROM denoland/deno:2.3.5

WORKDIR /twitch

COPY . .

WORKDIR /twitch/src

CMD ["run", "--allow-env", "--env-file", "--allow-net", "twitch.event.ts"]