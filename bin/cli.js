#!/usr/bin/env node

'use strict';

const exit = require('exit');
const program = require('commander');
const utils = require('./utils');
const Typograf = require('typograf');

const locales = Typograf.getLocales();
const types = ['digit', 'name', 'default'];

function splitByCommas(str) {
    return (str || '').split(/[,;]/).map(val => val.trim());
}

program
    .version(require('../package.json').version)
    .usage('[options] <file>')
    .option('-l, --locale <locale>', `Set the locale for rules (separated by commas). Available locales: "${locales.join('", "')}"`, splitByCommas, [])
    .option('-d, --disable-rule <rule>', 'Disable rules (separated by commas)', splitByCommas, null)
    .option('-e, --enable-rule <rule>', 'Enable rules (separated by commas)', splitByCommas, null)
    .option('--lint', 'Lint text with selected rules - default: false')
    .option('--stdin', 'Process text provided on <STDIN> - default: false')
    .option('--stdin-filename <file>', 'Specify filename to process STDIN as')
    .option('--config <file>', 'Use configuration from this file')
    .option('--html-entity-type <type>', 'HTML entities as: "digit" - &#160;, "name" - &nbsp, "default" - UTF-8 symbols')
    .option('--html-entity-only-invisible', 'Convert only invisible symbols to reqiured view')
    .parse(process.argv);

if (!program.stdin && !program.args.length) {
    program.help();
}

const config = utils.getConfig(program.config);
const prefs = utils.getPrefs(program, config);

if (!prefs.locale.length) {
    console.error('Error: required parameter locale.');
    exit(1);
}

for (const locale of prefs.locale) {
    if (!Typograf.hasLocale(locale)) {
        console.error(`Error: locale "${locale}" is not supported.`);
        exit(1);
    }
}

if (types.indexOf(prefs.htmlEntity.type || 'default') === -1) {
    console.error(`Error: mode "${prefs.htmlEntity.type}" is not supported.`);
    exit(1);
}

if (program.stdin) {
    prefs.filename = program.stdinFilename;

    utils.processStdin(prefs, () => {
        exit(0);
    });
} else {
    prefs.filename = program.args[0];
    
    if (!prefs.filename) {
        console.log('Error: file isn\'t specified.');
        exit(1);
    }

    utils.processFile(prefs, (error, data) => {
        if (error) {
            console.error(data);
            exit(1);
        } else {
            exit(0);
        }
    });
}
