# node-red-contrib-easytouch-ble is a simple NPM package (and NodeRED wrapper) for EasyTouch RV thermostats

---

# Getting Started

## Prerequisites

* [Node.js](https://nodejs.org/en/) v18.0.0 or newer
* [Node-RED](https://nodered.org) v3.0.0 or newer

## Installation

Install via Node-RED Manage Palette

`@k3vmcd/node-red-contrib-easytouch-ble`

Install via npm

```
$ cd ~/.node-red
$ npm install @k3vmcd/node-red-contrib-easytouch-ble
# then restart node-red
```

---

# Example Usage

### Changing the thermostat temperature

![changing temperature](images/node.png)

**Note: The password is the thermostat's user account password. This password is sent directly to the device using Bluetooth (never sent over HTTPS).**
