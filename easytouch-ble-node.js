const EasyTouch = require('./easytouch.js');

module.exports = function(RED) {
  // EasyTouch Status Node
  function EasyTouchStatusNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    node.on('input', function(msg) {
      EasyTouch.startListening(async peripheral => {
        const status = await EasyTouch.getDeviceStatus(this.credentials.password)
        msg.payload = JSON.stringify(status, null, 4)
        node.send(msg)
      })
    });
  }

  // EasyTouch Update Node
  function EasyTouchUpdateNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    node.on('input', function(msg) {
      EasyTouch.startListening(async peripheral => {
        if (config.parameter == "Temperature") {
          await EasyTouch.updateTemperature(config.update, this.credentials.password)
        }
        node.send(msg)
      })
    });
  }

  RED.nodes.registerType("EasyTouch Status",EasyTouchStatusNode, {
    credentials: {
         password: {type:"password"}
     }
  });

  RED.nodes.registerType("EasyTouch Update",EasyTouchUpdateNode, {
    credentials: {
         password: {type:"password"}
     }
  });
}
