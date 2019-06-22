# Woodhouse
=======
Woodhouse is an extendable, modular bot inspired by [GitHub's Hubot](https://github.com/github/hubot) that allows you to automate tasks or call APIs through plugins and by using interface modules, it can connect to diferent services for you to communicate with it.

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
