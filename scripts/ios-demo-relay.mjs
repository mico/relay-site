#!/usr/bin/env node
// Read-only, localhost-only demo relay for the landing page's native iOS captures.
// No credentials, network market reads, or trading writes; serves a saved market snapshot.
// Run: node scripts/ios-demo-relay.mjs [/absolute/path/to/relay-terminal]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const market = JSON.parse(await readFile(new URL('./fixtures/pepe-market.json', import.meta.url), 'utf8'));
const pepeMark = Number(market.klines.at(-1)[4]);
const pepeEntry = Number((pepeMark + 186 / 400000).toFixed(7));
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
const terminal = resolve(process.argv[2] || fileURLToPath(new URL('../../relay-terminal', import.meta.url)));
const { seed } = await import(pathToFileURL(join(terminal, 'design/fixture.mjs')));
const now = Date.now(), day = 864e5, today = Math.floor(now / day) * day;
export const deposit = 1000;
const specs = [
  ['1000PEPEUSDT', -400000, pepeEntry, 186, Number((pepeEntry + .00005).toFixed(7)), .00520],
  ['SOLUSDT', 8, 178.40, 96, 175.90, 181.20],
  ['ETHUSDT', .8, 2286, 64, 2261, 2300],
  ['BTCUSDT', .02, 78400, 18, 77400, 77400],
];
export const positions = specs.map(([symbol, qty, entry, pnl]) => ({symbol, positionAmt: String(qty), entryPrice: String(entry), unrealizedProfit: String(pnl), leverage: '5', positionSide: 'BOTH'}));
const symbols = ['SOLUSDT', 'ETHUSDT', '1000PEPEUSDT', 'BTCUSDT'];
const daily = [72, 118, -26, 184, 236, 312, 388];
export const trades = daily.flatMap((net, d) => {
  const amounts = d === 2 ? [-14, -12] : [net * .46, net * .32, net * .22];
  return amounts.map((profit, i) => {
    const ts = today - (6 - d) * day + (i + 1) * 3600e3;
    return {id: `demo-${d}-${i}`, symbol: symbols[(d+i)%4], side: i%2 ? 'short' : 'long', outcome: profit > 0 ? 'target' : 'stopped', ts, closedTs: ts + 1800e3, entry: 100, pnl: profit + 1.2, fee: 1.2, r: profit / 20, ai: `demo-ai-${d}-${i}`, grade: 'A', gradeComputed: 'A', gradeTagged: true, setup: i%2 ? 'failed_breakout' : 'failed_breakdown'};
  });
});
export const realized = trades.reduce((sum, t) => sum + t.pnl - t.fee, 0);
const wallet = Math.round((deposit + realized)*100)/100, upnl = specs.reduce((s,p) => s+p[3],0);
export const account = {totalWalletBalance:String(wallet), usdtWallet:String(wallet), totalUnrealizedProfit:String(upnl), totalMarginBalance:String(wallet+upnl), availableBalance:'1740', positions};
function protection(symbol) {
  const [sym,qty,entry,,stop,current] = specs.find(p=>p[0]===symbol) ?? specs[0];
  return {symbol:sym, algo:[{orderType:'STOP_MARKET', side:qty>0?'SELL':'BUY', positionSide:'BOTH', triggerPrice:String(current), closePosition:true, algoStatus:'NEW'}], plain:[], warnings:[], plan:{ts:today+3600e3,side:qty>0?'long':'short',entry,stop,tpR:12,why:'Demo capture'}};
}
function candles(url) {
  if (url.searchParams.get('symbol') !== market.symbol || url.searchParams.get('interval') !== market.interval) {
    throw new Error('The screenshot market snapshot only covers 1000PEPEUSDT at 15m');
  }
  return market.klines;
}

const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'), path=url.pathname;
  res.setHeader('Content-Type','application/json');
  if(req.method!=='GET'){res.writeHead(405);res.end(JSON.stringify({error:'Read-only demo fixture'}));return;}
  let body;
  switch(path){
    case '/api/status': body={...seed.status(),defaultEnv:'paper',envs:{paper:{hasKeys:true,exchange:'binance',label:'Paper'}},user:{id:'demo',name:'demo'}}; break;
    case '/api/account': body=account; break;
    case '/api/trades': body={trades:[...trades].reverse()}; break;
    case '/api/protection': body=protection(url.searchParams.get('symbol')); break;
    case '/api/bots': body={bots:[{id:'demo-bot',strategy:'oi-pump-long',slot:'paper',state:'armed',armedAt:today,armedBy:'demo',positions:{SOLUSDT:{dir:1},ETHUSDT:{dir:1}},fires:[],firedToday:3,realMoney:false}]}; break;
    case '/api/ai/trades': body={live:[]}; break;
    case '/api/session': body=seed.sessionRead(url,now); break;
    case '/api/market/klines':
      if(url.searchParams.get('symbol')!==market.symbol || url.searchParams.get('interval')!==market.interval){res.writeHead(404);body={error:'Snapshot only covers PEPE 15m'};} else body=candles(url);
      break;
    case '/api/market/ticker24h': body=[{symbol:'BTCUSDT',lastPrice:'79300',priceChangePercent:'2.84'},{symbol:'ETHUSDT',lastPrice:'2366',priceChangePercent:'3.51'}]; break;
    case '/api/market/openInterest': body={symbol:market.symbol,interval:market.interval,source:'coinglass',venues:['coinglass'],missing:[],rows:market.openInterest}; break;
    case '/api/market/takerVolume': body={symbol:market.symbol,interval:market.interval,source:'coinglass',venue:'coinglass',market:'futures',rows:market.takerVolume}; break;
    case '/api/macd': body=seed.macd(url,now); break;
    default: res.writeHead(404); body={error:`Demo fixture does not serve ${path}`};
  }
  res.end(JSON.stringify(body));
});
server.listen(8791,'127.0.0.1',()=>console.log(`Demo fixture on http://127.0.0.1:8791 · deposit $${deposit} · realized $${realized} · equity $${wallet+upnl}`));
