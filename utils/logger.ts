import chalk from 'chalk';
import packageJSON from '../package.json';

const _log = (msg: string) => console.log(`\n${packageHeader} ${msg} \n`),
  packageHeader = chalk.blueBright.bold(
    `${packageJSON.name} ${packageJSON.version}:`
  );

export default {
  error: (msg: string) => _log(chalk.red.bold(msg)),
  warning: (msg: string) => _log(chalk.yellow.bold(msg)),
  primary: (msg: string) => _log(chalk.blue.bold(msg)),
  logger: _log,
};
