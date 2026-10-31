# iPhone landing page captures

The three `img/ios-{positions,position,journal}.webp` assets are captures of
Relay's native SwiftUI app, not illustrations. They replace the previous
sign-in and bots pair. The gallery keeps the demo-data label and scrolls
horizontally on phones so each screenshot stays readable.

## Demo scenario

- Starting deposit: $1,000.
- Closed net profit, after fees: $1,284 (+128.4%), or +64.2R at $20 per R.
- Wallet: $2,284; open PnL: $364; equity: $2,648.
- Four positions: PEPE short +$186; SOL long +$96; ETH long +$64;
  BTC long +$18. Three stops lock profit; the BTC stop risks $20.
- Seven UTC days: +72, +118, -26, +184, +236, +312, +388.
- 18 wins, 2 losses; median +2.8R; the $26 drawdown recovers the next day.

Account and trade values are illustrative. The chart uses unmodified historical
market observations saved in `scripts/fixtures/pepe-market.json`: Binance
15-minute OHLCV and Coinglass aggregated OI and futures taker volume. All three
feeds share the same 160 timestamps, ending 29 October 2026 at 21:00 UTC.
The PEPE paper short enters at 0.0053582, marks at the observed 0.0048932,
and has a tightened stop at 0.00520. The $186 profit is the simulated trade
overlay; no market prices, volumes or derivative values were scaled or synthesized.

The fixture is only a localhost read server and rejects every write. It never
uses exchange accounts or credentials or fetches network data during capture.

## Capture setup

Run `node scripts/ios-demo-relay.mjs /absolute/path/to/relay-terminal` with
Node 18 or later. The terminal checkout supplies the existing market-session
fixture builder. Market chart data comes from the committed snapshot. Omitting the path uses a sibling
`relay-terminal` checkout. The server listens on `127.0.0.1:8791`.

Build a **temporary copy** of the terminal's `ios/` project, keeping production
app source unchanged. For the captures, the temporary `RelayApp.swift` starts
`RootView.tab` at `.journal` when `--journal` is passed; `--position` renders
`PositionScreen(id: "1000PEPEUSDT:BOTH:S", back: {})` in the trade tab.
The temporary `ChartPrefs` initializer selects EMA 8, EMA 21, Bollinger,
Volume, Aggregated OI and Taker futures. These launch switches are capture
harness changes, not features of the shipped app.

Use a Debug simulator build, launch with
`-relay.base http://localhost:8791 -relay.env paper`, and capture the default
positions view, `--position`, and `--journal`. The explicit launch arguments
avoid stale simulator preferences. Use `simctl status_bar` for 9:41, full Wi-Fi
and cellular bars, and a full discharging battery. Wait for the charts to
finish loading and inspect a second capture; simulator images can lag.

These assets were captured on iPhone 17 Pro at 1206×2622 with Relay 0.0.62,
then encoded with `cwebp -q 92 -resize 804 1748 input.png -o output.webp`.
Stop the demo server and restore the original simulator app and preferences
after capturing. The landing page is static; there is no build step.
