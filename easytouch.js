const noble = require('@abandonware/noble')

module.exports = { startListening, getDeviceStatus, updateTemperature, updatePowerStatus }

/**
 * These are the static UUIDS that are used to identify Easy Touch devices
 * */
const UUIDS = {
  EASY_TOUCH_DEVICE_IDENTIFIER: '0d18',
 	DEVICE_CHARACTERISTICS: ['00FF'],
 	AUTH_CHARACTERISTIC: 'DD01',
 	COMMAND_CHARACTERISTIC: 'EE01',
 	STATUS_CHARACTERISTIC: 'FF01'
}
const EASY_TOUCH_CHARACTERISTICS = [UUIDS.STATUS_CHARACTERISTIC, UUIDS.COMMAND_CHARACTERISTIC, UUIDS.AUTH_CHARACTERISTIC]

/**
 * The peripheral/streams will be populated once connected to an Easy Touch device
 * */
var connectedPeripheral = null
var writeStream = null
var deviceStream = null
var pwStream = null

// 
async function getDeviceStatus(password) {
	// login to the device
	await __loginToDevice(password)
	
 	// tell device that we want to check the current status
 	await __sendMessageToStream('{"Type":"Get Status","Zone" : 0}', writeStream)

 	// get the current status
	const deviceInfoString = (await deviceStream.readAsync())
  const deviceInfo = JSON.parse(deviceInfoString)

  // create a more human readable response
  const deviceStatus = {}
  deviceStatus['heatIsRunning'] = deviceInfo['status']['0'][1] == 2 || deviceInfo['status']['0'][1] == 14
  deviceStatus['temperature'] = deviceInfo['status']['0'][3]
  deviceStatus['outsideTemperature'] = deviceInfo['status']['0'][4]
  deviceStatus['fanSetting'] = deviceInfo['status']['0'][10] == 1 ? "Low" : (deviceInfo['status']['0'][10] == 255 ? "Auto" : "High")
  deviceStatus['desiredTemperature'] = deviceInfo['status']['0'][11]
  deviceStatus['powerIsOn'] = deviceInfo['parmFlags'] == 44
  deviceStatus['fullResponse'] = deviceInfo
  return deviceStatus
}

async function updateTemperature(temperature, password) {
	await __loginToDevice(password)
	await __sendMessageToStream(`{"Type": "Change", "Changes": {"zone": 0, "sched_sp": ${temperature}}}`, writeStream)
}

async function updatePowerStatus(onOrOff, password) {
	await __loginToDevice(password)
	await __sendMessageToStream(`{"Type": "Change", "Changes": {"zone": 0, "power": "${onOrOff ? "On" : "Off"}"}}`, writeStream)
}

async function startListening(handler) {
	await noble.startScanningAsync([UUIDS.EASY_TOUCH_DEVICE_IDENTIFIER], false)

	// if we already have the peripheral, reconnect and execute handler
	if (connectedPeripheral) {
		connectedPeripheral = await connectToPeripheral(connectedPeripheral, handler)
		return
	}

	// once an EasyTouch device has been found connect to it
	noble.on('discover', async (peripheral) => {
	  await noble.stopScanningAsync()
	  connectedPeripheral = await connectToPeripheral(peripheral, handler)
	})
}

async function connectToPeripheral(peripheral, handler) {
	await peripheral.connectAsync()

  const {characteristics} = await peripheral.discoverSomeServicesAndCharacteristicsAsync(UUIDS.DEVICE_CHARACTERISTICS, EASY_TOUCH_CHARACTERISTICS)

   // grab the three characteristics 
  writeStream = characteristics.find(c => { return c.uuid.toUpperCase() == UUIDS.COMMAND_CHARACTERISTIC })
  deviceStream = characteristics.find(c => { return c.uuid.toUpperCase() == UUIDS.STATUS_CHARACTERISTIC })
	pwStream = characteristics.find(c => { return c.uuid.toUpperCase() == UUIDS.AUTH_CHARACTERISTIC })
	
	await handler(connectedPeripheral)

	// disconnect from peripheral and cleanup
	peripheral.disconnect((error) => {
		writeStream = null
		deviceStream = null
		pwStream = null
		noble._peripherals = [] // <-- undocumented magic sauce. found here: https://github.com/noble/noble/issues/692#issuecomment-335408717
	}) 

  return peripheral
}


// login to the device
async function __loginToDevice(password) {
	const response = await __sendMessageToStream(password, pwStream)
	if (response.startsWith("Matched") == false) {
		throw Error('{"error": "Unable to login to the device. Is the password correct?"}')
	}
}

async function __sendMessageToStream(message, stream) {
	await stream.write(Buffer.from(message, 'utf8'), false)
	return (await stream.readAsync()).toString()
}
