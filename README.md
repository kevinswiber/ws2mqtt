# ws2mqtt

A WebSocket proxy to an MQTT broker backend.

## Install the CLI

```
npm install -g ws2mqtt
```

## Usage

Run a WebSocket server that proxies messages to an MQTT broker.

```
ws2mqtt [-h <websocket-host>] [-p <websocket-port>] [-c <mqtt-broker-url>]
[--debug]

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -h, --host     WebSocket server host           [string] [default: "localhost"]
  -p, --port     WebSocket server port                  [number] [default: 3000]
  -c, --broker   Connection URL to an MQTT broker
                                     [string] [default: "mqtt://localhost:1883"]
  -d, --debug    Print debug info                     [boolean] [default: false]
```

Once the proxy is running, connect to the WebSocket server using the following URL format:

```
http://{host}:{port}/{+topic}{?action}
```

Where `host` and `port` reference the values used when starting the proxy, `topic` matches the MQTT topic (e.g., `myhome/temperature`), and the `action` query string parameter equals `publish` or `subscribe`.

Test your proxy with the [WebSocket Proxy to MQTT Broker](https://www.postman.com/postman/workspace/kevin-swiber-s-public-workspace/collection/61cb5550eadba8828892f36a?uac=y) Postman collection!

## License

MIT
