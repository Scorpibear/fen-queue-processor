describe('processor', () => {
  const Processor = require('../processor');
  const fen = 'pnK...';
  const moves = ['d3','d5'];
  const depth = 40;
  const score = -0.24;
  const bestMove = 'd4';
  const queue = {deleteItem: () => {}, getItem: (fen) => ({moves, fen, depth}),
    getAllItems: () => ([])
  };
  const evaluation = {save: () => {}};
  const analyzer = {analyze: () => {}};
  const evaluationSource1 = {getFen: ()=>{}};
  const evaluationSource2 = {getFen: ()=>{}};
  const evaluationSources = [evaluationSource1, evaluationSource2];
  const processor = new Processor({queue, evaluation, analyzer, evaluationSources});

  describe('process', () => {
    it('uses analyzer if no immediate answer in evaluation sources', () => {
      spyOn(analyzer, 'analyze').and.stub();
      spyOn(queue, 'getAllItems').and.returnValue([{moves, fen, depth}]);
      processor.process();
      expect(analyzer.analyze).toHaveBeenCalledWith({moves, fen, depth});
    });
    it('get fen from the first evaluation source', () => {
      spyOn(queue, 'getAllItems').and.returnValue([{moves, fen, depth}]);
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      processor.process();
      expect(evaluationSource1.getFen).toHaveBeenCalledWith(fen);
    });
    it('does not touch the next evaluation source if there is answer in the previous', () => {
      spyOn(queue, 'getAllItems').and.returnValue([{moves, fen, depth}]);
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(evaluationSource2, 'getFen').and.stub();
      processor.process();
      expect(evaluationSource2.getFen).not.toHaveBeenCalled();
    });
    it('analyzer is not called if evaluation sources has an answer', () => {
      spyOn(queue, 'getAllItems').and.returnValue([{moves, fen, depth}]);
      spyOn(evaluationSource2, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(analyzer, 'analyze').and.stub();
      processor.process();
      expect(analyzer.analyze).not.toHaveBeenCalled();
    });
    it('registers evaluation if there is answer in evaluation sources', () => {
      spyOn(queue, 'getAllItems').and.returnValue([{moves, fen, depth}]);
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(processor, 'registerEvaluation').and.stub();
      processor.process();
      expect(processor.registerEvaluation).toHaveBeenCalledWith({fen, bestMove, score, depth});
    });
    it('works asynchronous', () => {
      expect(processor.process()).toEqual(jasmine.any(Promise));
    });
  });

  describe('registerEvaluation', () => {
    it('gets evaluation item from queue', () => {
      spyOn(queue, 'getItem').and.returnValue({fen, moves, depth});
      processor.registerEvaluation({fen, bestMove, depth, score});
      expect(queue.getItem).toHaveBeenCalledWith(fen);
    });
    it('delete item if depth match with item in queue', () => {
      spyOn(queue, 'deleteItem');
      processor.registerEvaluation({fen, depth, score, bestMove});
      expect(queue.deleteItem).toHaveBeenCalledWith(fen);
    });
    it('delete item if depth > than depth of item in queue', () => {
      spyOn(queue, 'deleteItem');
      processor.registerEvaluation({fen, depth: depth + 1, score, bestMove});
      expect(queue.deleteItem).toHaveBeenCalledWith(fen);
    });
    it('save evaluation if depth match with item in queue', () => {
      spyOn(queue, 'getItem').and.returnValue({moves, depth, fen});
      spyOn(evaluation, 'save');
      processor.registerEvaluation({fen, depth, score, bestMove});
      expect(evaluation.save).toHaveBeenCalledWith({moves, bestMove, score, depth});
    });
    it('do not delete item from queue if depth < of depth in queue', () => {
      spyOn(queue, 'getItem').and.returnValue({fen, depth: 41});
      spyOn(queue, 'deleteItem');
      processor.registerEvaluation({fen, depth, score, bestMove});
      expect(queue.deleteItem).not.toHaveBeenCalled();
    });
  });
});
