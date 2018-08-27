# Chess Positions Queue Processor
[![Build Status](https://travis-ci.org/Scorpibear/chess-positions-queue-processor.svg?branch=master)](https://travis-ci.org/Scorpibear/chess-positions-queue-processor)
[![Coverage Status](https://codecov.io/gh/Scorpibear/chess-positions-queue-processor/branch/master/graph/badge.svg)](https://codecov.io/gh/Scorpibear/chess-positions-queue-processor)
[![npm version](https://badge.fury.io/js/chess-positions-queue-processor.svg)](https://www.npmjs.com/package/chess-positions-queue-processor)


Process queue of chess positions which needs to be analyzed

## Install
```
npm install chess-positions-queue-processor --save
```

## Usage
```javascript
const Processor = require('../processor');
const processor = new Processor({queue, evaluation, analyzer});
processor.process(); // call queue.getAllItems and calls for each analyzer.analyze
//...
processor.registerEvaluation({fen, depth, score, bestMove}); // calls evaluation.save and queue.delete for all analyzed enough positions
```

## Specification
[Processor specification](./spec/processor.spec.js)