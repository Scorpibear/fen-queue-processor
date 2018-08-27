class QueueProcessor {
  constructor({queue, evaluation, evaluationSources, analyzer}) {
    this.queue = queue;
    this.evaluation = evaluation;
    this.evaluationSources = evaluationSources;
    this.analyzer = analyzer;
    this.Console = console;
  }
  process() {
    return new Promise(resolve => {
      this.processSync();
      resolve();
    }, err => {
      this.Console.error(err);
    });
  }
  processSync() {
    const items = this.queue.getAllItems();
    items.forEach(item => {
      let i = 0;
      let result = undefined;
      while(i < this.evaluationSources.length && !result) {
        result = this.evaluationSources[i].getFen(item.fen);
        i++;
      }
      if(result) {
        this.registerEvaluation(result);
      } else {
        this.analyzer.analyze(item);
      }
    });
  }
  registerEvaluation({fen, bestMove, depth, score}) {
    const item = this.queue.getItem(fen);
    // make sense to delete item and register evaluation only if depth is enough
    if(depth >= item.depth) {
      this.evaluation.save({moves: item.moves, bestMove, depth, score});
      this.queue.deleteItem(fen);
    }
  }
}

module.exports = QueueProcessor;
