const Processor = require('../processor');

describe('processor', () => {
  const fen = 'pnK...';
  const moves = ['d3','d5'];
  const depth = 40;
  const item = {fen, depth, moves};
  const score = -0.24;
  const bestMove = 'd4';
  const queue = {
    delete: () => {},
    get: ({fen, depth, moves}) => (item),
    getAllItems: () => ([])
  };
  const evaluation = {save: () => {}};
  const analyzer = {analyze: () => {}};
  const evaluationSource1 = {getFen: ()=>{}};
  const evaluationSource2 = {getFen: ()=>{}};
  const evaluationSources = [evaluationSource1, evaluationSource2];
  const strategy = {isInteresting: () => true};
  const stubConsole = {error: () => {}, log: () => {}};
  let processor;

  beforeEach(() => {
    processor = new Processor({queue, evaluation, analyzer, evaluationSources, strategy});
    processor.Console = stubConsole;
  });

  it('rejects evaluationSources without getFen function', () => {
    expect(()=>{ 
      new Processor({queue, evaluation, analyzer, evaluationSources: [{}], strategy});
    }).toThrow('evaluation sources should have getFen function');
  });

  it('go smoothly if getFen function is defined in evaluation sources', () => {
    expect(new Processor({queue, evaluation, analyzer,
      evaluationSources: [evaluationSource1], strategy})).toBeDefined();
  });

  describe('process', () => {
    it('works asynchronous', () => {
      expect(processor.process()).toEqual(jasmine.any(Promise));
    });
    it('does not allow to run 2 processSync in the same time', done => {
      spyOn(processor, 'processSync');
      processor.process().then(() => {
        expect(processor.processSync).toHaveBeenCalledTimes(1);
        done();
      });
      processor.process();
    });
    it('runs eventually the required number of times', done => {
      spyOn(processor, 'processSync');
      const promises = [];
      promises.push(processor.process());
      promises.push(processor.process());
      promises.push(processor.process());
      Promise.all(promises).then(() => {
        expect(processor.processSync).toHaveBeenCalledTimes(3);
        done();
      }).catch(err => {
        done(err);
      });
    });
    it('logs error if processSync throws an error', async () => {
      spyOn(stubConsole, 'error').and.stub();
      spyOn(processor, 'processSync').and.throwError('unexpected failure');
      await processor.process();
      expect(stubConsole.error).toHaveBeenCalled();
    });
  });

  describe('processItem', () => {
    it('uses analyzer if no immediate answer in evaluation sources', async () => {
      spyOn(analyzer, 'analyze').and.stub();
      await processor.processItem(item);
      expect(analyzer.analyze).toHaveBeenCalledWith(item);
    });
    it('get fen from the first evaluation source', async () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      await processor.processItem(item);
      expect(evaluationSource1.getFen).toHaveBeenCalledWith(item);
    });
    it('register evaluation for result from the first available source', async () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(evaluationSource2, 'getFen').and.stub();
      spyOn(processor, 'registerEvaluation');
      await processor.processItem(item);
      expect(processor.registerEvaluation).toHaveBeenCalledWith({fen, bestMove, score, depth});
    });
    it('consider an answer is available only if bestMove has been provided', async () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, score, depth});
      spyOn(evaluationSource2, 'getFen').and.returnValue({fen: 'bbb', bestMove, score: 0.02, depth: 20});
      spyOn(processor, 'registerEvaluation');
      await processor.processItem(item);
      expect(processor.registerEvaluation).toHaveBeenCalledWith({fen: 'bbb', bestMove, score: 0.02, depth: 20});
    });
    it('analyzer is not called if evaluation sources has an answer', async () => {
      spyOn(evaluationSource2, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(analyzer, 'analyze').and.stub();
      await processor.processItem(item);
      expect(analyzer.analyze).not.toHaveBeenCalled();
    });
    it('registers evaluation if there is answer in evaluation sources', async () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(processor, 'registerEvaluation').and.stub();
      await processor.processItem(item);
      expect(processor.registerEvaluation).toHaveBeenCalledWith({fen, bestMove, score, depth});
    });
    it('do not bother evaluation sources if position is not interesting for analysis', async () => {
      spyOn(evaluationSource1, 'getFen');
      spyOn(strategy, 'isInteresting').and.returnValue(false);
      await processor.processItem({moves: ['h4', 'h5'], fen, depth});
      expect(evaluationSource1.getFen).not.toHaveBeenCalled();
    });
    it('do not bother evaluation sources if position interest is undefined yet', async () => {
      spyOn(evaluationSource1, 'getFen');
      spyOn(strategy, 'isInteresting').and.returnValue(undefined);
      await processor.processItem({moves: ['h4', 'h5'], fen, depth});
      expect(evaluationSource1.getFen).not.toHaveBeenCalled();
    });
    it('deletes item from queue if it is not interesting for analysis', async () => {
      spyOn(strategy, 'isInteresting').and.returnValue(false);
      spyOn(queue, 'delete').and.stub();
      await processor.processItem(item);
      expect(queue.delete).toHaveBeenCalledWith(fen);
    });
    it('leaves item in queue if isInteresting is undefined yet', async () => {
      spyOn(strategy, 'isInteresting').and.returnValue(undefined);
      spyOn(queue, 'delete').and.stub();
      await processor.processItem(item);
      expect(queue.delete).not.toHaveBeenCalledWith(fen);
    });
    it('process item if strategy is not defined', async () => {
      let processor = new Processor({ queue, evaluation, evaluationSources, analyzer });
      spyOn(analyzer, 'analyze').and.stub();

      await processor.processItem(item);

      expect(analyzer.analyze).toHaveBeenCalled();
    });
  });

  describe('processSync', () => {
    it('calls processItem', () => {
      spyOn(processor, 'processItem').and.stub();
      spyOn(queue, 'getAllItems').and.returnValue([item]);
      processor.processSync();
      expect(processor.processItem).toHaveBeenCalledWith(item);
    });
  });

  describe('registerEvaluation', () => {
    it('gets evaluation item from queue', () => {
      spyOn(queue, 'get').and.returnValue(item);
      processor.registerEvaluation({fen, bestMove, depth, score});
      expect(queue.get).toHaveBeenCalledWith({fen});
    });
    it('delete item if depth match with item in queue', () => {
      spyOn(queue, 'delete');
      processor.registerEvaluation({fen, depth, score, bestMove});
      expect(queue.delete).toHaveBeenCalledWith(fen);
    });
    it('delete item if depth > than depth of item in queue', () => {
      spyOn(queue, 'delete');
      processor.registerEvaluation({fen, depth: depth + 1, score, bestMove});
      expect(queue.delete).toHaveBeenCalledWith(fen);
    });
    it('save evaluation if depth match with item in queue', () => {
      spyOn(queue, 'get').and.returnValue(item);
      spyOn(evaluation, 'save');
      processor.registerEvaluation({fen, depth, score, bestMove});
      expect(evaluation.save).toHaveBeenCalledWith({moves, bestMove, score, depth});
    });
    it('do not delete item from queue if depth < of depth in queue', () => {
      spyOn(queue, 'get').and.returnValue({fen, depth: 41});
      spyOn(queue, 'delete');
      processor.registerEvaluation({fen, depth, score, bestMove});
      expect(queue.delete).not.toHaveBeenCalled();
    });
    it('logs error if fen was not in queue', () => {
      spyOn(processor.Console, 'error').and.stub();
      spyOn(queue, 'get').and.returnValue(null);

      processor.registerEvaluation({ fen: 'unknown '});

      expect(processor.Console.error).toHaveBeenCalled();
    });
  });
});
