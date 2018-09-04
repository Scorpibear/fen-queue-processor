describe('processor', () => {
  const Processor = require('../processor');
  const fen = 'pnK...';
  const moves = ['d3','d5'];
  const depth = 40;
  const item = {fen, depth, moves};
  const score = -0.24;
  const bestMove = 'd4';
  const queue = {delete: () => {}, get: ({fen, depth, moves}) => ({fen, depth, moves}),
    getAllItems: () => ([])
  };
  const evaluation = {save: () => {}};
  const analyzer = {analyze: () => {}};
  const evaluationSource1 = {getFen: ()=>{}};
  const evaluationSource2 = {getFen: ()=>{}};
  const evaluationSources = [evaluationSource1, evaluationSource2];
  const strategy = {isInteresting: () => true};
  const processor = new Processor({queue, evaluation, analyzer, evaluationSources, strategy});

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
      processor.process().catch(err => {
        done();
        throw err;
      });
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
        done();
        throw err;
      });
    });
  });

  describe('processItem', () => {
    it('uses analyzer if no immediate answer in evaluation sources', () => {
      spyOn(analyzer, 'analyze').and.stub();
      processor.processItem(item);
      expect(analyzer.analyze).toHaveBeenCalledWith(item);
    });
    it('get fen from the first evaluation source', () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      processor.processItem(item);
      expect(evaluationSource1.getFen).toHaveBeenCalledWith(item);
    });
    it('does not touch the next evaluation source if there is answer in the previous', () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(evaluationSource2, 'getFen').and.stub();
      processor.processSync(item);
      expect(evaluationSource2.getFen).not.toHaveBeenCalled();
    });
    it('analyzer is not called if evaluation sources has an answer', () => {
      spyOn(evaluationSource2, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(analyzer, 'analyze').and.stub();
      processor.processItem(item);
      expect(analyzer.analyze).not.toHaveBeenCalled();
    });
    it('registers evaluation if there is answer in evaluation sources', () => {
      spyOn(evaluationSource1, 'getFen').and.returnValue({fen, bestMove, score, depth});
      spyOn(processor, 'registerEvaluation').and.stub();
      processor.processItem(item);
      expect(processor.registerEvaluation).toHaveBeenCalledWith({fen, bestMove, score, depth});
    });
    it('do not bother evaluation sources if position is not interesting for analysis', () => {
      spyOn(evaluationSource1, 'getFen');
      spyOn(strategy, 'isInteresting').and.returnValue(false);
      processor.processItem({moves: ['h4', 'h5'], fen, depth});
      expect(evaluationSource1.getFen).not.toHaveBeenCalled();
    });
    it('deletes item from queue if it is not interesting for analysis', () => {
      spyOn(strategy, 'isInteresting').and.returnValue(false);
      spyOn(queue, 'delete').and.stub();
      processor.processItem(item);
      expect(queue.delete).toHaveBeenCalledWith(fen);
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
      expect(queue.get).toHaveBeenCalledWith({fen, depth});
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
  });
});
