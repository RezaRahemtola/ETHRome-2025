# 🇮🇹 ETHRome 2025 - Raduno

Raduno ("Gathering" or "Meetup" in Italian) is a fully decentralized event platform (luma-like) available as a miniapp on Base.
It removes the friction of using multiple platforms for events (Luma to register, Telegram/Discord to communicate, wallet to get POAPs...) while providing a beginner-friendly web3 solution.

Started during the [ETHRome 2025 hackathon](https://ethrome.org), it was awarded 3 prizes for a total of $4500:
- 🥇 Best use of ENS
- 🥇 Best use of the XMTP Agent SDK
- 🥇 Best Base Miniapp - Small business category

The project is now being developed further for a future launch, stay tuned 🚀

## ⚙️ Installation

To run the project locally, simply clone the repository and follow these steps

### Contracts

The following contract addresses are the ones of the deployed version on Base mainnet, feel free to use them or to redeploy the contracts (located in [the contracts folder](./contracts/)).
- ENS L2Registry: [`0xc02f3b4cbe3431a46a19416211aee7f004d829c3`](https://basescan.org/address/0xc02f3b4cbe3431a46a19416211aee7f004d829c3)
- ENS L2Registrar: [`0x0A20Ab270Ac8Ffeb026fe5e57Ea31C2e58a686e0`](https://basescan.org/address/0x0A20Ab270Ac8Ffeb026fe5e57Ea31C2e58a686e0)
- RadunoEventFactory: [`0xc37933Bc35F432375d6EE63a532AA1E3fb2Fb732`](https://basescan.org/address/0xc37933Bc35F432375d6EE63a532AA1E3fb2Fb732)

### Frontend

Duplicate the `.example.env` file into `.env` and fill the required variables:

Then you just need to install the dependencies and start the project:
```sh
npm install
npm run dev
```

### XMTP agent

Again, duplicate the `.env.example` file into `.env` and fill the required variables.


Install the dependencies & launch the agent:
```sh
npm install
npm run dev
```

## 🚀 Getting started

To use Raduno, you can either follow the steps above to launch your own version of the app or use the [deployed version](https://raduno.reza.dev).

> 💡 Raduno is optimized for an experience inside the Base app where it is available as a miniapp

## 📈 Current caveats and future improvements

As a hackathon project built in solo, this is obviously not finished and can be improved in many ways. Some examples and ideas I'd like to explore are listed below

- 📈 UI / UX improvements
  - Allow users to edit events, receive reminder notifications for their events...
  - Enhance the platform to also be correctly usable on desktop
- 🤝 Enable custom contracts deployment, overriding the default Raduno contract to create their own (payment-gated event, accessible only to holders of a certain POAP etc)
- ⚙️ Import existing ENS names for official events verifiable fully onchain
- 🧠 Various codebase improvements & refactoring, some parts were generated with AI tools and are far from perfect

<div align="center">
  <h2>Made with ❤️ by</h2>
  <a href="https://github.com/RezaRahemtola">
    <img src="https://github.com/RezaRahemtola.png?size=85" width=85/>
    <br>
    <sub>Reza Rahemtola</sub>
  </a>
</div>
