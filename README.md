# FEN Queue Processor
[![Build Status](https://travis-ci.org/Scorpibear/fen-queue-processor.svg?branch=master)](https://travis-ci.org/Scorpibear/fen-queue-processor)
[![Coverage Status](https://codecov.io/gh/Scorpibear/fen-queue-processor/branch/master/graph/badge.svg)](https://codecov.io/gh/Scorpibear/fen-queue-processor)
[![npm version](https://badge.fury.io/js/fen-queue-processor.svg)](https://www.npmjs.com/package/fen-queue-processor)


Process and analyzes queue of chess positions in FEN format

## Install
```
npm install fen-queue-processor --save
```

## Usage
```javascript
const Processor = require('fen-queue-processor');
const processor = new Processor({queue, evaluation, analyzer, strategy, evaluationSources});
await processor.process(); // call queue.getAllItems, clarifies with strategy is it interesting for analysis, checks for answer in evaluation sources and calls for interesting not analyzed positions analyzer.analyze
//...
processor.registerEvaluation({fen, depth, score, bestMove}); // calls evaluation.save and queue.delete for all analyzed enough positions
```

## Specification
[Processor specification](./spec/processor.spec.js)
