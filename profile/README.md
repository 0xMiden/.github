![](https://github.com/user-attachments/assets/cf6eac98-5977-4bc5-b4ba-e4eb0c72672c)

[![Chat on Telegram][ico-telegram]][link-telegram] [![Website][ico-website]][link-website] [![Chat on Twitter][ico-twitter]][link-twitter]

[ico-telegram]: https://img.shields.io/badge/TG-build-blue.svg?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDI0YzYuNjI3IDAgMTItNS4zNzMgMTItMTJTMTguNjI3IDAgMTIgMCAwIDUuMzczIDAgMTJzNS4zNzMgMTIgMTIgMTJaIiBmaWxsPSJ1cmwoI2EpIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01LjQyNSAxMS44NzFhNzk2LjQxNCA3OTYuNDE0IDAgMCAxIDYuOTk0LTMuMDE4YzMuMzI4LTEuMzg4IDQuMDI3LTEuNjI4IDQuNDc3LTEuNjM4LjEgMCAuMzIuMDIuNDcuMTQuMTIuMS4xNS4yMy4xNy4zMy4wMi4xLjA0LjMxLjAyLjQ3LS4xOCAxLjg5OC0uOTYgNi41MDQtMS4zNiA4LjYyMi0uMTcuOS0uNSAxLjE5OS0uODE5IDEuMjI5LS43LjA2LTEuMjI5LS40Ni0xLjg5OC0uOS0xLjA2LS42ODktMS42NDktMS4xMTktMi42NzgtMS43OTgtMS4xOS0uNzgtLjQyLTEuMjA5LjI2LTEuOTA4LjE4LS4xOCAzLjI0Ny0yLjk3OCAzLjMwNy0zLjIyOC4wMS0uMDMuMDEtLjE1LS4wNi0uMjEtLjA3LS4wNi0uMTctLjA0LS4yNS0uMDItLjExLjAyLTEuNzg4IDEuMTQtNS4wNTYgMy4zNDgtLjQ4LjMzLS45MDkuNDktMS4yOTkuNDgtLjQzLS4wMS0xLjI0OC0uMjQtMS44NjgtLjQ0LS43NS0uMjQtMS4zNDktLjM3LTEuMjk5LS43OS4wMy0uMjIuMzMtLjQ0Ljg5LS42NjlaIiBmaWxsPSIjZmZmIi8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMTEuOTkiIHkxPSIwIiB4Mj0iMTEuOTkiIHkyPSIyMy44MSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIHN0b3AtY29sb3I9IiMyQUFCRUUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyMjlFRDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48L3N2Zz4K&url=https%3A%2F%2Ft.me%2FBuildOnMiden%2F1
[ico-twitter]: https://img.shields.io/twitter/url?label=Miden&style=social&url=https%3A%2F%2Ftwitter.com%2F0xmiden
[ico-website]: https://img.shields.io/static/v1?label=docs&message=Miden&color=Ff5500

[link-telegram]: https://t.me/BuildOnMiden/1
[link-twitter]: https://twitter.com/0xMiden
[link-website]: https://miden.xyz

# Miden
Miden is the edge blockchain that grants applications the power to scale with public and private transactions. It aims at builders who want to create an ecosystem for private asset management and OTC-trading.

## Project structure
This repository stores all the code for Polygon Miden. Everything is open source. 

| Repository              | Description |
| ----------------------- | ----------- |
| [Miden Base](https://github.com/0xMiden/miden-base)    | Core components of the Polygon Miden rollup. |
| [Miden Compiler](https://github.com/0xMiden/compiler)  | Compiler from MidenIR to Miden Assembly. |
| [Miden Client](https://github.com/0xMiden/miden-client)| A reference Miden Client to be used by users. |
| [Miden Node](https://github.com/0xMiden/miden-node)    | Miden Node to be used by the Miden operators. |
| [Miden VM](https://github.com/0xMiden/miden-vm)        | STARK-based virtual machine for Polygon Miden rollup. |
| [Miden Crypto](https://github.com/0xMiden/crypto)      | Cryptographic primitives used in Polygon Miden rollup. |

## Status
The [public testnet](https://0xmiden.github.io/miden-docs/imported/miden-client/src/get-started/prerequisites.html) is up and running. You can interact with the Miden node using the Miden client. Currently, there are only predefined smart contracts and node scripts. As soon as there is the Miden Rust compiler, builders can start writing their own contracts.

You can also use the Miden VM v0.9 locally and on the Miden [playground](https://0xpolygonmiden.github.io/examples/). For more detailed information, check out the Miden VM repository or our [Miden VM docs](https://0xmiden.github.io/miden-docs/imported/miden-vm/src/intro/main.html).
    
If you want to use parts of Polygon Miden - like the Miden VM or AirScript - please contact [us](dschmid@polygon.technology).

## Design    

### Key features of Polygon Miden
1. **Client-side proving** where users can locally execute transactions and create proofs of them on their own. 
2. **Parallel transaction execution** where causally independent transactions can be processed in parallel.
3. **Privacy** which includes the ability to engage in private transactions as well as have privacy-preserving smart contracts.
4. **Support for composable smart contracts** via safe but Turing-complete language. This is needed to support safer wallets, DeFi, DAOs, and many other cool use cases.
5. **Native support for multiple assets** where the environment itself ensures asset safety and allows fee payments in multiple assets, etc.

    
## License
This project is [MIT licensed](https://github.com/0xMiden/.github/blob/main/LICENSE).
