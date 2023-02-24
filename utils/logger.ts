import chalk from 'chalk'
import packageJSON from '../package.json'

const _log = (msg: string) => console.log(`\n${msg}\n`)

export default {
  error: (msg: string) => _log(chalk.red.bold(msg)),
  warning: (msg: string) => _log(chalk.yellow.bold(msg)),
  primary: (msg: string) => _log(chalk.blue.bold(msg)),
  logger: _log,
  packageName: chalk.blueBright.bold(`${packageJSON.name} ${packageJSON.version}:`),
  desc: chalk.greenBright.bold
}
