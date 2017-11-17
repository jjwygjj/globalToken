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
  .option('-U, --redis_url <redis_url>', '[redis:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]')
  .parse(process.argv)
const mode = program.mode || 'file'
const token_url = program.token_url
const user = program.user
const repository = program.repository
const file = program.file
const filepath = program.filepath
const redis_url = program.redis_url
console.log('args:',{
  mode,
  token_url,
  user,
  repository,
  file,
  filepath,
  redis_url
})
const url = `https://raw.githubusercontent.com/${user}/${repository}/master/${file}`
axios.get(url)
  .then(function (response) {
    const {hosts_config, func_config} = response.data
    const remotes = Object.values(hosts_config)
    createFunc(func_config)
    createSh(remotes, filepath)
    const update = require(path.join(__dirname,'..','update.js'))()
    update.then(x => {
      console.log('==生产token成功==')
      saveFile('token.txt', JSON.stringify(x.data))
      if(mode === 'file') {
        console.log('==file deploy==')
        deploy()
      }else {
        console.log('==redis deploy==')
        deploy_redis(JSON.stringify(x.data))
      }
    })
    .catch(function (error) {
      console.log(error)
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
  function createSh (data, pathfile) {
    let deploy_string = ''
    data.map(x => {
      const ip = x.ip
      const user = x.user
      deploy_string += `rsync -azP ${path.join(__dirname,'..','token.txt')} ${user}@${ip}:${pathfile}/token.txt \n`
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
    return
  }

  function deploy_redis(data){
    const client = redis.createClient({url: redis_url})
    client.on('ready', function () {client.set("token", data)})
    return
  }
