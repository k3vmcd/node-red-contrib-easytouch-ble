const noble = require('@abandonware/noble')
const { Command, Option, InvalidArgumentError, Argument } = require('commander')
const EasyTouch = require('./easytouch.js');

/**
 * Command line argument parsing logic
 * */
const program = new Command()
program
  .name('easytouch-ble')
  .description('CLI for managing EasyTouch RV thermostats.')
  .version('1.0.0')

program.command('status')
  .description('Get the current status of an EasyTouch device')
  .addOption(new Option('-p, --password <EASY_TOUCH_DEVICE_BLE_PASSWORD>', 'The login password for your EasyTouch device.').env('EASYTOUCH_PW').makeOptionMandatory())
  .addOption(new Option('-o, --only-show <type>', 'Only return the contents of a specific value').choices(['heatIsRunning', 'temperature', 'outsideTemperature', 'desiredTemperature', 'fanSetting', 'powerIsOn']))
  .action((result, options) => {
  	EasyTouch.startListening(async peripheral => {
  		const status = await EasyTouch.getDeviceStatus(result.password)
  		console.log(result.onlyShow ? status[result.onlyShow] : JSON.stringify(status, null, 4))
    	process.exit(0)
  	})
  })

const updateCommand = program.command('update')
	.description('Update a setting on the EasyTouch device')
	.addOption(new Option('-p, --password <EASY_TOUCH_DEVICE_BLE_PASSWORD>', 'The login password for your EasyTouch device.').env('EASYTOUCH_PW').makeOptionMandatory())

// update temperature
updateCommand.command('temperature')
	.argument('<temperature>', 'The new temperature to set the thermostat to', function (value) {
		const parsedValue = parseInt(value, 10)
		if (isNaN(parsedValue)) {
			throw new InvalidArgumentError('Not a number.')
		}
		return parsedValue
	})
	.action((temperature, options, command) => {
		EasyTouch.startListening(async () => {
			await EasyTouch.updateTemperature(temperature, command.parent._optionValues.password)
  		process.exit(0)
  	})
	})

// update power setting
updateCommand.command('power')
	.addArgument(new Argument('<On/Off>', 'Turn the thermostat on or off').choices(['on', 'off']))
	.action((onOrOff, options, command) => {
		EasyTouch.startListening(async () => {
			await EasyTouch.updatePowerStatus(onOrOff == "on", command.parent._optionValues.password)
  		process.exit(0)
  	})
	})


program.parse()
