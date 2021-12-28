#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const server = require('../lib/server');

const argv = yargs(hideBin(process.argv))
  .usage(
    '$0 [-h <websocket-host>] [-p <websocket-port>] [-c <mqtt-broker-url>] [--debug]'
  )
  .option('host', {
    alias: 'h',
    type: 'string',
    description: 'WebSocket server host',
    default: 'localhost',
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'WebSocket server port',
    default: 3000,
  })
  .option('broker', {
    alias: 'c',
    type: 'string',
    description: 'Connection URL to an MQTT broker',
    default: 'mqtt://localhost:1883',
  })
  .option('debug', {
    alias: 'd',
    type: 'boolean',
    description: 'Print debug info',
    default: false,
  }).argv;

const { host, port, broker, debug } = argv;

server({
  host,
  port: process.env.PORT || port,
  broker: process.env.MQTT_BROKER_URL || broker,
  debug,
});
