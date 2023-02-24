// import inquirer from 'inquirer'
import { execSync } from 'child_process'
console.log(execSync('ls', {encoding: "buffer"}).toString("utf8"))