const mqtt = require('mqtt');
const { WebSocket, WebSocketServer } = require('ws');
const pino = require('pino');

module.exports = ({ host, port, broker, debug }) => {
  const defaultLevel = debug && 'debug';
  const logger = pino({
    level: process.env.LOG_LEVEL || defaultLevel || 'info',
    transport: process.env.NODE_ENV !== 'production' && {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });

  mqttLogger = logger.child({ component: 'mqtt' });
  wsLogger = logger.child({ component: 'ws' });

  const wss = new WebSocketServer({ host, port });
  wss.on('listening', () => {
    const addr = wss.address();
    wsLogger.info(`websocket server listening on ${addr.address}:${addr.port}`);
  });

  const interval = setInterval(function ping() {
    for (ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', function close() {
    clearInterval(interval);
  });

  const mqttClient = mqtt.connect(broker);

  mqttClient.on('message', (topic, payload) => {
    mqttLogger.debug({
      msg: 'receiving message',
      topic,
      payload: payload.toString(),
    });

    const filteredClients = wss.clients.filter(
      (ws) =>
        ws.topic === topic &&
        ws.action === 'subscribe' &&
        ws.readyState === WebSocket.OPEN
    );

    wsLogger.debug({
      msg: `broadcasting to ${filteredClients.length} ws clients`,
      topic,
      payload: payload.toString(),
    });
    for (client of filteredClients) {
      client.send(payload.toString());
    }
  });

  mqttClient.on('connect', () => {
    mqttLogger.info(`client connected to: ${broker}`);
    wss.on('connection', (ws, req) => {
      const { remoteAddress } = req.socket;
      wsLogger.debug({ msg: 'client connection established', remoteAddress });
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === '/') {
        ws.send(
          JSON.stringify({
            error: 'invalid topic, include a path other than /',
          })
        );
        ws.close();
        wsLogger.debug(
          'client connection closing, invalid topic.',
          topic,
          remoteAddress
        );
        return;
      }

      const topic = url.pathname.substring(1);
      const action = url.searchParams.get('action') || 'subscribe';

      ws.topic = topic;
      ws.action = action;
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      if (action === 'subscribe') {
        mqttLogger.debug({ msg: 'client subscribing', topic, action });
        mqttClient.subscribe(topic, (err) => {
          if (err) {
            ws.send(
              JSON.stringify({
                error: `subscribing to \`${topic}\` failed, ${err}`,
              })
            );
            return;
          }
        });
      } else if (action === 'publish') {
        ws.on('message', (payload) => {
          mqttLogger.debug({
            msg: 'publishing',
            topic,
            payload: payload.toString(),
            remoteAddress,
          });
          mqttClient.publish(topic, payload);
        });
      }
    });
  });
};
