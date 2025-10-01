import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import './App.css';

const Gridworld3D = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [episode, setEpisode] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [avgRewards, setAvgRewards] = useState([]);
  const [selectedZ, setSelectedZ] = useState(2);
  const [qTable, setQTable] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [evalResults, setEvalResults] = useState(null);
  const [gridworld, setGridworld] = useState(null);

  useEffect(() => {
    const gw = new GridWorld3DClass(6, 6, 6, 0.8);
    setGridworld(gw);
  }, []);

  const startTraining = async () => {
    if (!gridworld) return;
    
    setIsTraining(true);
    setRewards([]);
    setAvgRewards([]);
    setEpisode(0);
    
    const numEpisodes = 1000;
    const alpha = 0.1;
    const gamma = 0.95;
    const epsilon = 0.1;
    
    const newQTable = {};
    const episodeRewards = [];
    const movingAvg = [];
    
    for (let ep = 0; ep < numEpisodes; ep++) {
      let state = gridworld.reset();
      let totalReward = 0;
      let done = false;
      let steps = 0;
      const maxSteps = 200;
      
      while (!done && steps < maxSteps) {
        let action;
        if (Math.random() < epsilon) {
          action = Math.floor(Math.random() * 6);
        } else {
          action = getMaxQAction(newQTable, state);
        }
        
        const { nextState, reward, isDone } = gridworld.step(action);
        
        const stateKey = stateToKey(state);
        const nextStateKey = stateToKey(nextState);
        
        if (!newQTable[stateKey]) {
          newQTable[stateKey] = new Array(6).fill(0);
        }
        if (!newQTable[nextStateKey]) {
          newQTable[nextStateKey] = new Array(6).fill(0);
        }
        
        const maxNextQ = Math.max(...newQTable[nextStateKey]);
        newQTable[stateKey][action] += alpha * (
          reward + gamma * maxNextQ - newQTable[stateKey][action]
        );
        
        totalReward += reward;
        state = nextState;
        done = isDone;
        steps++;
      }
      
      episodeRewards.push(totalReward);
      
      const windowSize = 50;
      if (ep >= windowSize - 1) {
        const sum = episodeRewards.slice(ep - windowSize + 1, ep + 1).reduce((a, b) => a + b, 0);
        movingAvg.push(sum / windowSize);
      } else {
        movingAvg.push(episodeRewards.slice(0, ep + 1).reduce((a, b) => a + b, 0) / (ep + 1));
      }
      
      if (ep % 50 === 0) {
        setEpisode(ep);
        setRewards([...episodeRewards]);
        setAvgRewards([...movingAvg]);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    setEpisode(numEpisodes);
    setRewards(episodeRewards);
    setAvgRewards(movingAvg);
    setQTable(newQTable);
    
    const newPolicy = extractPolicy(newQTable, gridworld);
    setPolicy(newPolicy);
    
    evaluatePolicy(newQTable, gridworld);
    
    setIsTraining(false);
  };

  const evaluatePolicy = (qTable, gw) => {
    const numTestEpisodes = 100;
    let totalReturns = 0;
    let randomReturns = 0;
    
    for (let i = 0; i < numTestEpisodes; i++) {
      let state = gw.reset();
      let done = false;
      let reward = 0;
      let steps = 0;
      
      while (!done && steps < 200) {
        const action = getMaxQAction(qTable, state);
        const result = gw.step(action);
        reward += result.reward;
        state = result.nextState;
        done = result.isDone;
        steps++;
      }
      totalReturns += reward;
      
      state = gw.reset();
      done = false;
      reward = 0;
      steps = 0;
      
      while (!done && steps < 200) {
        const action = Math.floor(Math.random() * 6);
        const result = gw.step(action);
        reward += result.reward;
        state = result.nextState;
        done = result.isDone;
        steps++;
      }
      randomReturns += reward;
    }
    
    setEvalResults({
      learned: totalReturns / numTestEpisodes,
      random: randomReturns / numTestEpisodes
    });
  };

  const stateToKey = (state) => `${state[0]},${state[1]},${state[2]}`;

  const getMaxQAction = (qTable, state) => {
    const key = stateToKey(state);
    if (!qTable[key]) return Math.floor(Math.random() * 6);
    
    const qValues = qTable[key];
    let maxQ = qValues[0];
    let maxActions = [0];
    
    for (let i = 1; i < qValues.length; i++) {
      if (qValues[i] > maxQ) {
        maxQ = qValues[i];
        maxActions = [i];
      } else if (qValues[i] === maxQ) {
        maxActions.push(i);
      }
    }
    
    return maxActions[Math.floor(Math.random() * maxActions.length)];
  };

  const extractPolicy = (qTable, gw) => {
    const pol = {};
    for (let x = 0; x < gw.width; x++) {
      for (let y = 0; y < gw.height; y++) {
        for (let z = 0; z < gw.depth; z++) {
          const state = [x, y, z];
          if (gw.isValidState(state)) {
            pol[stateToKey(state)] = getMaxQAction(qTable, state);
          }
        }
      }
    }
    return pol;
  };

  const getValueFunction = () => {
    if (!qTable || !gridworld) return null;
    
    const values = {};
    for (let x = 0; x < gridworld.width; x++) {
      for (let y = 0; y < gridworld.height; y++) {
        for (let z = 0; z < gridworld.depth; z++) {
          const state = [x, y, z];
          const key = stateToKey(state);
          if (qTable[key]) {
            values[key] = Math.max(...qTable[key]);
          }
        }
      }
    }
    return values;
  };

  const renderGrid = () => {
    if (!gridworld) return null;
    
    const values = getValueFunction();
    const cellSize = 50;
    
    return (
      <div className="grid-container">
        <div className="grid-label">Z-Level: {selectedZ}</div>
        <div className="grid-cells" style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${gridworld.width}, ${cellSize}px)`,
          gap: '2px'
        }}>
          {Array.from({ length: gridworld.height }).map((_, y) =>
            Array.from({ length: gridworld.width }).map((_, x) => {
              const state = [x, y, selectedZ];
              const key = stateToKey(state);
              const isObstacle = gridworld.obstacles.some(obs => 
                obs[0] === x && obs[1] === y && obs[2] === selectedZ
              );
              const isGoal = gridworld.goal[0] === x && gridworld.goal[1] === y && gridworld.goal[2] === selectedZ;
              const isPit = gridworld.pit[0] === x && gridworld.pit[1] === y && gridworld.pit[2] === selectedZ;
              
              let bgColor = '#f0f0f0';
              if (isObstacle) bgColor = '#333';
              else if (isGoal) bgColor = '#4ade80';
              else if (isPit) bgColor = '#ef4444';
              else if (values && values[key]) {
                const val = values[key];
                const intensity = Math.min(255, Math.max(0, Math.floor((val + 50) * 2.55)));
                bgColor = `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
              }
              
              const arrowSymbol = policy && policy[key] !== undefined ? 
                ['→', '←', '↑', '↓', '⊕', '⊖'][policy[key]] : '';
              
              return (
                <div
                  key={`${x}-${y}-${selectedZ}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: bgColor,
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: isObstacle ? '#fff' : '#000'
                  }}
                >
                  {isGoal ? 'G' : isPit ? 'P' : arrowSymbol}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1>3D Gridworld Q-Learning</h1>
      
      <div className="main-grid">
        <div className="card">
          <h2>Training Control</h2>
          
          <button
            onClick={startTraining}
            disabled={isTraining}
            className="train-button"
          >
            {isTraining ? <><Pause size={20} /> Training...</> : <><Play size={20} /> Start Training</>}
          </button>
          
          <div className="info-text">
            <p>Episodes: {episode} / 1000</p>
            <p>Parameters: α=0.1, γ=0.95, ε=0.1</p>
          </div>
          
          {evalResults && (
            <div className="eval-results">
              <h3>Evaluation Results (100 episodes):</h3>
              <p>Learned Policy: {evalResults.learned.toFixed(2)}</p>
              <p>Random Policy: {evalResults.random.toFixed(2)}</p>
              <p className="improvement">
                Improvement: {(evalResults.learned - evalResults.random).toFixed(2)}
              </p>
            </div>
          )}
        </div>
        
        <div className="card">
          <h2>Learning Curves</h2>
          {rewards.length > 0 && (
            <svg width="100%" height="300" viewBox="0 0 500 300">
              <path
                d={rewards.map((r, i) => 
                  `${i === 0 ? 'M' : 'L'} ${i * 500 / rewards.length} ${150 - r}`
                ).join(' ')}
                stroke="#ccc"
                strokeWidth="1"
                fill="none"
              />
              <path
                d={avgRewards.map((r, i) => 
                  `${i === 0 ? 'M' : 'L'} ${i * 500 / avgRewards.length} ${150 - r}`
                ).join(' ')}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
              />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#999" strokeWidth="1" strokeDasharray="5,5" />
              <text x="10" y="145" fontSize="12" fill="#666">0</text>
            </svg>
          )}
          <p className="chart-label">Blue line: Moving average reward</p>
        </div>
      </div>
      
      <div className="card visualization">
        <h2>Value Function & Policy Visualization</h2>
        
        <div className="slider-container">
          <label>Select Z-Level:</label>
          <input
            type="range"
            min="0"
            max="5"
            value={selectedZ}
            onChange={(e) => setSelectedZ(parseInt(e.target.value))}
          />
          <span>{selectedZ}</span>
        </div>
        
        <div className="grid-wrapper">
          {renderGrid()}
        </div>
        
        <div className="legend">
          <p>G = Goal (+50), P = Pit (-50), Black = Obstacle</p>
          <p>Arrows: → (East), ← (West), ↑ (North), ↓ (South), ⊕ (Up), ⊖ (Down)</p>
          <p>Color intensity: Blue indicates higher value</p>
        </div>
      </div>
    </div>
  );
};

// GridWorld3D Class
class GridWorld3DClass {
  constructor(width = 6, height = 6, depth = 6, slipProb = 0.2) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.slipProb = slipProb;
    this.actions = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
    this.goal = [5, 5, 5];
    this.pit = [2, 2, 2];
    this.obstacles = this.generateObstacles();
    this.reset();
  }
  
  generateObstacles() {
    const obstacles = [];
    const totalCells = this.width * this.height * this.depth;
    const numObstacles = Math.floor(totalCells * 0.12);
    
    const seed = 42;
    let rng = seed;
    const random = () => {
      rng = (rng * 1664525 + 1013904223) % 4294967296;
      return rng / 4294967296;
    };
    
    while (obstacles.length < numObstacles) {
      const x = Math.floor(random() * this.width);
      const y = Math.floor(random() * this.height);
      const z = Math.floor(random() * this.depth);
      
      if ((x === 0 && y === 0 && z === 0) || 
          (x === this.goal[0] && y === this.goal[1] && z === this.goal[2]) ||
          (x === this.pit[0] && y === this.pit[1] && z === this.pit[2])) {
        continue;
      }
      
      const exists = obstacles.some(obs => obs[0] === x && obs[1] === y && obs[2] === z);
      if (!exists) {
        obstacles.push([x, y, z]);
      }
    }
    
    return obstacles;
  }
  
  reset() {
    this.state = [0, 0, 0];
    return [...this.state];
  }
  
  isValidState(state) {
    const [x, y, z] = state;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) {
      return false;
    }
    return !this.obstacles.some(obs => obs[0] === x && obs[1] === y && obs[2] === z);
  }
  
  isTerminal(state) {
    return (state[0] === this.goal[0] && state[1] === this.goal[1] && state[2] === this.goal[2]) ||
           (state[0] === this.pit[0] && state[1] === this.pit[1] && state[2] === this.pit[2]);
  }
  
  step(action) {
    if (this.isTerminal(this.state)) {
      return { nextState: [...this.state], reward: 0, isDone: true };
    }
    
    let actualAction = action;
    
    if (Math.random() > (1 - this.slipProb)) {
      const perpActions = this.getPerpendicularActions(action);
      actualAction = perpActions[Math.floor(Math.random() * perpActions.length)];
    }
    
    const delta = this.actions[actualAction];
    const nextState = [
      this.state[0] + delta[0],
      this.state[1] + delta[1],
      this.state[2] + delta[2]
    ];
    
    if (this.isValidState(nextState)) {
      this.state = nextState;
    }
    
    let reward = -1;
    let done = false;
    
    if (this.state[0] === this.goal[0] && this.state[1] === this.goal[1] && this.state[2] === this.goal[2]) {
      reward = 50;
      done = true;
    } else if (this.state[0] === this.pit[0] && this.state[1] === this.pit[1] && this.state[2] === this.pit[2]) {
      reward = -50;
      done = true;
    }
    
    return { nextState: [...this.state], reward, isDone: done };
  }
  
  getPerpendicularActions(action) {
    if (action <= 1) {
      return [2, 3, 4, 5];
    } else if (action <= 3) {
      return [0, 1, 4, 5];
    } else {
      return [0, 1, 2, 3];
    }
  }
}

export default Gridworld3D;