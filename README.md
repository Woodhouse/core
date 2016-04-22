# Woodhouse

Note: This project is currently being rewritten in the [v2 branch](https://github.com/Woodhouse/core/tree/dev/v2)

This readme should help you get the basics of Woodhouse up and running

## Installation

* `git clone` this repository
* `npm install` in the root. This will install all dependancies and build the web UI

## Running

* `node index.js`
* View the web interface at [http://localhost:8080](http://localhost:8080)

## Interfaces and plugins

* Clone the interface/plugin into the relevant directory.
* `npm install` within the cloned directory
* If Woodhouse isn't already started, start it and skip to the last step
* If you have the shell interface enabled (enabled by default), run `load modules`, otherwise restart Woodhouse
* Go to [http://localhost:8080](http://localhost:8080), navigate to the module/plugin you just installed, check the enabled box and click save.
