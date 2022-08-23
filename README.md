# DJ Controller JS

[![Build](https://github.com/fwcd/dj-controller-js/actions/workflows/build.yml/badge.svg)](https://github.com/fwcd/dj-controller-js/actions/workflows/build.yml)

A library for interacting with MIDI DJ controllers in JavaScript.

## Features

The library aims to be...

- **Compatible:** By using [Mixxx](https://github.com/mixxxdj/mixxx)'s mapping format, we can use existing mappings for a [wide range of controllers](https://github.com/mixxxdj/mixxx/tree/main/res/controllers).
- **Extensible:** Adding custom DJ controllers is easy.
- **Lightweight:** By operating entirely abstractly in terms of interfaces it can be used anywhere, including in browsers and Node.js-based environments.

## Getting Started

To install the dependencies, run

```sh
npm install
```

To build the package, run

```sh
npm run build
```

To continuously rebuild it in the background you can also use

```sh
npm run watch
```
