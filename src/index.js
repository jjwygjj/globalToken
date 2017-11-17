const pkg = require('../package.json')
const program = require('commander')
const axios = require('axios')
const path = require('path')
const fs = require('fs')
const redis = require('redis')
const { exec } = require('child_process')

program
  .version(pkg.version)
  .description(pkg.description)
  .option('-u, --user <user>', 'github user')
  .option('-r, --repository <repository>', 'github repository')
  .option('-f, --file <file>', 'github flie')
  .option('-p, --filepath <filepath>', 'remotes path')
  .option('-t, --token_url <token_url>', 'get token_url')
  .option('-m, --mode <mode>', 'The token is sent to the remote mode. file and redis')
  .option('-rh, --redis_host <redis_host>', 'redis_host')
  .option('-rp, --redis_port <redis_port>', 'redis_port')
  .option('-rpw, --redis_password <redis_password>', 'redis_password')
  .parse(process.argv)

const mode = program.mode || 'file'
const token_url = program.token_url
const user = program.user
const repository = program.repository
const file = program.file
const filepath = program.filepath
const url = `https://raw.githubusercontent.com/${user}/${repository}/master/${file}`
axios.get(url)
  .then(function (response) {
    const {hosts_config, func_config} = response.data
    const remotes = Object.values(hosts_config)
    createFunc(func_config)
    createSh(remotes, filepath)
    const update = require('../update')()
    update.then(x => {
      saveFile('token.txt', JSON.stringify(x.data))
      if(mode === 'file') {
        deploy()
      }else {
        deploy_redis(JSON.stringify(x.data))
      }
    })
  })
  .catch(function (error) {
    console.log(error)
  })

  function saveFile(filename, data) {
    filename = path.join(__dirname,'..',filename)
    return fs.writeFileSync(filename,data)
  }
  function createFunc (data) {
    data = data.replace('url',`"${token_url}"`)
    const func = `var axios = require('axios') \n module.exports = ${data}`
    saveFile('update.js', func)
  }
  function createSh (data, path) {
    let deploy_string = ''
    data.map(x => {
      const ip = x.ip
      const user = x.user
      deploy_string += `rsync -azP ./token.txt ${user}@${ip}:${path}/token.txt \n`
    })
    saveFile('deploy.sh', deploy_string)
  }
  function deploy () {
    exec(`sh ${path.join(__dirname,'..','deploy.sh')}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    })
  }

  function deploy_redis(data){
    const client = redis.createClient({
      host: program.redis_host,
      port: program.redis_port,
      password: program.redis_password
    })
    client.on('ready', function () {client.set("token", data)})
  }
