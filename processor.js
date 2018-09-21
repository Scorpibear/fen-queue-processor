class QueueProcessor {
  constructor({queue, evaluation, evaluationSources, analyzer, strategy}) {
    this.queue = queue;
    this.evaluation = evaluation;
    this.evaluationSources = evaluationSources;
    if(!this.evaluationSources.every(source => 'getFen' in source)) {
      throw 'evaluation sources should have getFen function';
    }
    this.analyzer = analyzer;
    this.strategy = strategy;
    this.Console = console;
    this.processPromise = Promise.resolve();
  }
  process() {
    this.processPromise = this.processPromise.then(() => {
      this.processSync();
    }).catch(err => this.Console.error(err));
    return this.processPromise;
  }
  async processItem(item) {
    if(this.strategy) {
      switch(this.strategy.isInteresting(item.moves)) {
      case true:
        break;
      case false:
        this.queue.delete(item.fen);
        return;
      case undefined:
      default:
        return;
      }
    }
    let allPromisedResults = this.evaluationSources.map(source => source.getFen(item));
    const values = await Promise.all(allPromisedResults);
    for(let i = 0; i < values.length; i++) {
      if(values[i] && values[i].bestMove) {
        this.registerEvaluation(values[i]);
        return;
      }
    }
    this.analyzer.analyze(item);
  }
  processSync() {
    const items = this.queue.getAllItems();
    items.forEach(item => this.processItem(item));
  }
  registerEvaluation({fen, bestMove, depth, score}) {
    this.Console.log('Processor.RegisterEvaluation was called with: ', {fen, bestMove, depth, score});
    const item = this.queue.get({fen, depth});
    if(item) {
      // make sense to delete item and register evaluation only if depth is enough
      if(depth >= item.depth) {
        this.evaluation.save({moves: item.moves, bestMove, depth, score});
        this.queue.delete(fen);
      } else {
        this.Console.error(`Could not register evaluation because the item with fen '${fen}' has greater depth in queue than was provided`);  
      }
    } else {
      this.Console.error(`Could not register evaluation because the item with fen '${fen}' was not found in queue`);
    }
  }
}

module.exports = QueueProcessor;
