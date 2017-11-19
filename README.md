# globalToken
用于更新token的工具



npm install globaltoken -g

token_config文件存放在public github repository 中

1 mode === file 根据token_config文件配置将token发送到指定远程机器某个目录下，项目读取这个文件即可

2 mode === redis 将更新的token发送到redis中 其中key为token







  Options:

    -V, --version                  output the version number
    -u, --user <user>              github user
    -r, --repository <repository>  github repository
    -f, --file <file>              github flie
    -p, --filepath <filepath>      remotes path
    -t, --token_url <token_url>    get token_url
    -m, --mode <mode>              The token is sent to the remote mode. file and redis
    -U, --redis_url <redis_url>    [redis:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
    -h, --help                     output usage information
example:

每月 16号 23点更新token到redis，将mode 改为file 则更新token到54.223.103.193服务器下/srv/www/token.txt

crontab 0 22 15 * * /bin/sh ./update.sh



update.sh

```
#!/bin/bash
GT -u 10cella -m redis -U redis://:password@host:port -r make -f token_config -p /srv/www -t https://aip.baidubce.com/oauth/2.0/token\?grant_type=client_credentials\&client_id=xxx\&client_secret=xxx

```

token_config

```
{
"hosts_config":{"staging":{"ip":"54.223.103.193","user":"xx"}},
 "func_config":"function(){return axios.get(url)}"
}
```

