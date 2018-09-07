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
    }, err => this.Console.error(err)).catch(err => this.Console.error(err));
    return this.processPromise;
  }
  processItem(item) {
    if(this.strategy && !this.strategy.isInteresting(item.moves)) {
      this.queue.delete(item.fen);
      return;
    }
    let i = 0;
    let result = undefined;
    while(i < this.evaluationSources.length && !result) {
      result = this.evaluationSources[i].getFen(item);
      i++;
    }
    if(result) {
      this.registerEvaluation(result);
    } else {
      this.analyzer.analyze(item);
    }
  }
  processSync() {
    const items = this.queue.getAllItems();
    items.forEach(item => this.processItem(item));
  }
  registerEvaluation({fen, bestMove, depth, score}) {
    const item = this.queue.get({fen, depth});
    // make sense to delete item and register evaluation only if depth is enough
    if(depth >= item.depth) {
      this.evaluation.save({moves: item.moves, bestMove, depth, score});
      this.queue.delete(fen);
    }
  }
}

module.exports = QueueProcessor;
