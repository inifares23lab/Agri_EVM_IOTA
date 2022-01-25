# **Sample Agrifood Traceability Solution from Ethereum to IOTA v2**
## External Tools
- wasp [https://github.com/iotaledger/wasp](https://github.com/iotaledger/wasp)
- goshimmer [https://github.com/iotaledger/goshimmer](https://github.com/iotaledger/goshimmer)
- docker [https://www.docker.com](https://www.docker.com)
- metamask [https://metamask.io](https://metamask.io)
- ganache [https://trufflesuite.com/ganache](https://trufflesuite.com/ganache/)
## **IOTA** 
### *Fully local solution*
> Start WASP node and Goshimmer Network 
1. `git clone https://github.com/iotaledger/wasp`
2. `cd wasp/tools/devnet`
3. `docker-compose up`
> Create the EVM chain
1. `cd wasp/tools/wasp-cli`
2. Create a file named `wasp-cli.json` with this content:
```json
{
  "goshimmer": {
    "api": "127.0.0.1:8080",
    "faucetpowtarget": -1
  },
  "wasp": {
    "0": {
      "api": "127.0.0.1:9090",
      "nanomsg": "127.0.0.1:5550",
      "peering": "127.0.0.1:4000"
    }
  }
}
```
3. Create `initfile`:
> Use mock accounts from metamask!
```sh
#!/bin/sh
ownerAccount="METAMASK ACCOUNT 1";
p1Ac="METAMASK ACCOUNT 2";
p2Ac="METAMASK ACCOUNT 3";
certAc="METAMASK ACCOUNT 4";
ownerKey="METAMASK ACCOUNT KEY 1";
p1Key="METAMASK ACCOUNT KEY 2";
p2Key="METAMASK ACCOUNT KEY 3";
certKey="METAMASK ACCOUNT KEY 4";
value=VALUE_IN_WAI

go run main.go init

go run main.go peering info

pubkey=$(go run main.go peering info | grep PubKey | cut -d':' -f2)
netid=$(go run main.go peering info | grep NetID | cut -d':' -f2)

go run main.go peering trust $pubkey $netid:4000

go run main.go request-funds

go run main.go chain deploy --committee=0 --quorum=1 --chain=agrievm --description="EVM Chain for agrifood traceability"

go run main.go chain deposit IOTA:100000

go run main.go chain evm deploy -a agrievm --alloc $ownerAccount:$value,$p1Ac:$value,$p2Ac:$value,$certAc:$value

go run main.go chain evm jsonrpc --chainid 1074 --account $ownerKey
```
4. run `initfile`
### *Local solution and goshimmer public api*
> Start WASP node and Goshimmer Network 
1. `install wasp and wasp-cli`
2. `mkdir wasp-node && cd wasp-node`
3. Create a file named `config.json` with this content:
```json
{
  "database": {
    "directory": "waspdb"
  },
  "logger": {
    "level": "warn",
    "disableCaller": false,
    "disableStacktrace": true,
    "encoding": "console",
    "outputPaths": [
      "stdout",
      "wasp.log"
    ],
    "disableEvents": true
  },
  "network": {
    "bindAddress": "0.0.0.0",
    "externalAddress": "auto"
  },
  "node": {
    "disablePlugins": [],
    "enablePlugins": ["remotelog","networkdelay","spammer","prometheus","txstream","faucet"]
  },
  "webapi": {
    "bindAddress": "127.0.0.1:9090"
  },
  "dashboard": {
    "auth": {
      "scheme": "basic",
      "username": "wasp",
      "password": "wasp"
    },
    "bindAddress": "127.0.0.1:7000"
  },
  "peering":{
    "port": 4000,
    "netid": "127.0.0.1:4000"
  },
  "nodeconn": {
    "address": "goshimmer.sc.iota.org:5000"
  },
  "nanomsg":{
    "port": 5550
  }
}
```
5. run `wasp`
> Create the EVM chain
1. change only this from the previous `wasp-cli.json`:
```json
"goshimmer": {
    "api": "https://api.goshimmer.sc.iota.org",
    "faucetpowtarget": -1
  },
```
2. Change the command from `go run main.go` to `wasp-cli` from the previous `initfile`
3. run `initfile`
### *Common steps*
1. Create 4 Metamask mock accounts
2. set Metamask mock accounts and keys in `initfile` and in the javascript test file `scripts/Agri_IOTA.ethers.js`
4. Install dependencies: `npm install` 
5. Run the tests: `npm test`
## **Ethereum**
1. Install and start ganache on port 7545
2. Set Ganache keys in the javascript test file `scripts/Agri_ETH.ethers.js`
2. Install dependencies: `npm install`
3. Run Tests with:
    - `truffle test`
    - `npm run eth`